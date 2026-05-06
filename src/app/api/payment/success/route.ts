import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const tran_id = formData.get('tran_id') as string;
        const val_id = formData.get('val_id') as string;
        const status = formData.get('status') as string;

        if (!tran_id) {
            return NextResponse.redirect(new URL('/checkout/fail', req.url));
        }

        const supabase = getSupabase();

        if (status === 'VALID' || status === 'VALIDATED') {
            await supabase
                .from('orders')
                .update({
                    status: 'confirmed',
                    payment_status: 'captured',
                    ssl_val_id: val_id || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('transaction_id', tran_id);

            // Get order number for the success page
            const { data: order } = await supabase
                .from('orders')
                .select('order_number')
                .eq('transaction_id', tran_id)
                .single();

            const orderNumber = order?.order_number || '';
            return NextResponse.redirect(
                new URL(`/checkout/success?order=${orderNumber}`, req.url)
            );
        }

        return NextResponse.redirect(new URL('/checkout/fail', req.url));
    } catch (err) {
        console.error('Payment success callback error:', err);
        return NextResponse.redirect(new URL('/checkout/fail', req.url));
    }
}
