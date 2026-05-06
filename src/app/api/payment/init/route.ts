import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const store_id = process.env.SSLCOMMERZ_STORE_ID || '';
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD || '';
const is_sandbox = process.env.SSLCOMMERZ_IS_SANDBOX === 'true';
const base_url = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

const SSLCOMMERZ_API = is_sandbox
    ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
    : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

// Server-side supabase — uses user's token for RLS
function getSupabase(accessToken?: string) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : undefined
    );
    return supabase;
}

function generateOrderNumber() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VC-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, items, address, subtotal, shipping, tax, total, accessToken } = body;

        if (!userId || !items?.length || !address || !total) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = getSupabase(accessToken);
        const orderNumber = generateOrderNumber();
        const tran_id = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        // 1. Create order in DB
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                order_number: orderNumber,
                shipping_name: address.full_name,
                shipping_phone: address.phone,
                shipping_address_line_1: address.address_line_1,
                shipping_address_line_2: address.address_line_2 || null,
                shipping_city: address.city,
                shipping_state: address.state,
                shipping_postal_code: address.postal_code,
                shipping_country: address.country || 'Bangladesh',
                subtotal,
                shipping_cost: shipping,
                tax,
                total,
                status: 'pending',
                payment_status: 'pending',
                transaction_id: tran_id,
            })
            .select('id')
            .single();

        if (orderErr || !order) {
            console.error('Order create error:', orderErr);
            return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
        }

        // 2. Insert order items
        const orderItems = items.map((item: { id: string; name: string; image: string; slug: string; size?: string; quantity: number; price: number }) => ({
            order_id: order.id,
            product_id: item.id,
            product_name: item.name,
            product_image: item.image,
            product_slug: item.slug,
            size: item.size || null,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
        }));

        await supabase.from('order_items').insert(orderItems);

        // 3. Initiate SSLCommerz session (direct API call — no library needed)
        const sslParams = new URLSearchParams({
            store_id,
            store_passwd,
            total_amount: String(total),
            currency: 'BDT',
            tran_id,
            success_url: `${base_url}/api/payment/success`,
            fail_url: `${base_url}/api/payment/fail`,
            cancel_url: `${base_url}/api/payment/cancel`,
            ipn_url: `${base_url}/api/payment/success`,
            shipping_method: 'Courier',
            product_name: items.map((i: { name: string }) => i.name).join(', ').substring(0, 200),
            product_category: 'Beauty & Personal Care',
            product_profile: 'physical-goods',
            cus_name: address.full_name,
            cus_email: body.email || 'customer@valleycentia.com',
            cus_add1: address.address_line_1,
            cus_add2: address.address_line_2 || '',
            cus_city: address.city,
            cus_state: address.state,
            cus_postcode: address.postal_code,
            cus_country: address.country || 'Bangladesh',
            cus_phone: address.phone,
            ship_name: address.full_name,
            ship_add1: address.address_line_1,
            ship_add2: address.address_line_2 || '',
            ship_city: address.city,
            ship_state: address.state,
            ship_postcode: address.postal_code,
            ship_country: address.country || 'Bangladesh',
        });

        const sslResponse = await fetch(SSLCOMMERZ_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: sslParams.toString(),
        });

        const apiResponse = await sslResponse.json();

        if (apiResponse?.GatewayPageURL) {
            // Save session key
            await supabase
                .from('orders')
                .update({ ssl_session_key: apiResponse.sessionkey })
                .eq('id', order.id);

            return NextResponse.json({
                url: apiResponse.GatewayPageURL,
                orderNumber,
            });
        } else {
            console.error('SSLCommerz init failed:', apiResponse);
            return NextResponse.json({ error: apiResponse?.failedreason || 'Payment gateway error' }, { status: 500 });
        }
    } catch (err) {
        console.error('Payment init error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
