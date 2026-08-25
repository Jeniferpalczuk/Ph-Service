import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
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
                setAll(cookiesToSet) {
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

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    let user = null;
    let authError: { status?: number; message?: string } | null = null;

    try {
        const result = await supabase.auth.getUser();
        user = result.data.user;
        authError = result.error;
    } catch (error) {
        // A falha do serviço de autenticação não deve virar um erro RSC genérico.
        // O AuthGuard/Server Action ainda valida a sessão antes de expor dados.
        console.warn('[supabase-middleware] Falha temporária ao validar a sessão:', error);
        return supabaseResponse;
    }

    const authStatus = authError?.status ?? 0;
    const isTransientAuthError = authStatus === 401 || authStatus === 429 || authStatus >= 500;

    if (authError && isTransientAuthError) {
        // Durante uma indisponibilidade/401 transitório, não redirecione uma
        // Server Action para /login: isso faz o Next exibir apenas o digest.
        console.warn('[supabase-middleware] Serviço de autenticação indisponível:', authError.message);
        return supabaseResponse;
    }

    // Redirect unauthenticated users to login page (except for login page itself)
    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth')
    ) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from login page
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    return supabaseResponse;
}
