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

        if (tran_id) {
            const supabase = getSupabase();
            await supabase
                .from('orders')
                .update({
                    payment_status: 'failed',
                    updated_at: new Date().toISOString(),
                })
                .eq('transaction_id', tran_id);
        }

        return NextResponse.redirect(new URL('/checkout/fail', req.url));
    } catch (err) {
        console.error('Payment fail callback error:', err);
        return NextResponse.redirect(new URL('/checkout/fail', req.url));
    }
}
