import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

        // 1. Create order in DB — COD: status=confirmed, payment_status=pending, payment_method=cod
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
                status: 'confirmed',
                payment_status: 'pending',
                payment_method: 'cod',
            })
            .select('id')
            .single();

        if (orderErr || !order) {
            console.error('COD order create error:', orderErr);
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

        return NextResponse.json({
            success: true,
            orderNumber,
            orderId: order.id,
            items: items.map((i: { name: string; quantity: number; price: number; size?: string }) => ({
                name: i.name,
                quantity: i.quantity,
                price: i.price,
                size: i.size,
            })),
            address,
            subtotal,
            shipping,
            tax,
            total,
        });
    } catch (err) {
        console.error('COD order error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
