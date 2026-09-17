import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const AUTH_TIMEOUT_MS = 4_000;
const AUTH_TIMEOUT_MESSAGE = 'SUPABASE_AUTH_TIMEOUT';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const pathname = request.nextUrl.pathname;

    // Rotas de autenticação não precisam consultar o Supabase antes de abrir.
    // Isso também evita que uma indisponibilidade do serviço impeça o login.
    if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
        return supabaseResponse;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[supabase-middleware] Variáveis públicas do Supabase não configuradas.');
        return supabaseResponse;
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
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
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
        const result = await Promise.race([
            supabase.auth.getUser(),
            new Promise<never>((_, reject) => {
                timeoutId = setTimeout(
                    () => reject(new Error(AUTH_TIMEOUT_MESSAGE)),
                    AUTH_TIMEOUT_MS
                );
            }),
        ]);
        user = result.data.user;
        authError = result.error;
    } catch (error) {
        if (error instanceof Error && error.message === AUTH_TIMEOUT_MESSAGE) {
            console.warn(
                `[supabase-middleware] Validação da sessão excedeu ${AUTH_TIMEOUT_MS}ms; seguindo sem bloquear a página.`
            );
        } else {
            // A falha do serviço de autenticação não deve virar um erro RSC genérico.
            // O AuthGuard/Server Action ainda valida a sessão antes de expor dados.
            console.warn('[supabase-middleware] Falha temporária ao validar a sessão:', error);
        }
        return supabaseResponse;
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
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
        !pathname.startsWith('/login') &&
        !pathname.startsWith('/auth')
    ) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from login page
    if (user && pathname.startsWith('/login')) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    return supabaseResponse;
}
