import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/profile'];
// Routes that require admin role
const adminRoutes = ['/admin'];
// Routes only accessible when NOT logged in
const authRoutes = ['/auth'];

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh the session
    let user = null;
    try {
        const { data } = await supabase.auth.getUser();
        user = data?.user ?? null;
    } catch {
        user = null;
    }

    const pathname = request.nextUrl.pathname;

    // --- Auth routes: redirect to /profile if already logged in ---
    if (authRoutes.some(route => pathname.startsWith(route)) && !pathname.startsWith('/auth/callback')) {
        if (user) {
            const url = request.nextUrl.clone();
            url.pathname = '/profile';
            return NextResponse.redirect(url);
        }
        return supabaseResponse;
    }

    // --- Protected routes: redirect to /auth if not logged in ---
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/auth';
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
        return supabaseResponse;
    }

    // --- Admin routes: check auth + admin role ---
    if (adminRoutes.some(route => pathname.startsWith(route))) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/auth';
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }

        // Check admin role from user_profiles
        try {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (!profile || profile.role !== 'admin') {
                const url = request.nextUrl.clone();
                url.pathname = '/';
                url.searchParams.set('error', 'unauthorized');
                return NextResponse.redirect(url);
            }
        } catch {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            url.searchParams.set('error', 'unauthorized');
            return NextResponse.redirect(url);
        }

        return supabaseResponse;
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
