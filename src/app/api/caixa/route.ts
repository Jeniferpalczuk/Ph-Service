import { NextResponse } from 'next/server';
import { createCaixaAction } from '@/app/actions/financeiro';

export const dynamic = 'force-dynamic';

type CaixaCreateResponse =
    | { success: true; data: { id: string } }
    | { success: false; error: string };

/**
 * Mantém o lançamento do caixa fora do transporte de Server Actions.
 * A operação continua usando a mesma validação, autenticação e RLS, mas
 * erros do backend retornam como JSON em vez de um erro RSC genérico.
 */
export async function POST(request: Request) {
    try {
        const input: unknown = await request.json();
        const result = await createCaixaAction(input as Parameters<typeof createCaixaAction>[0]);
        const response = result as CaixaCreateResponse;

        return NextResponse.json(response, {
            status: response.success ? 200 : 422,
        });
    } catch (error) {
        console.error('[POST /api/caixa] Erro inesperado:', error);
        return NextResponse.json<CaixaCreateResponse>(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Erro ao lançar o fechamento.',
            },
            { status: 500 }
        );
    }
}
