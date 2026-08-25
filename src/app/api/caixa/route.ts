import { NextResponse } from 'next/server';
import { createCaixaAction, deleteCaixaAction } from '@/app/actions/financeiro';

export const dynamic = 'force-dynamic';

type CaixaResponse =
    | { success: true; data?: { id: string } }
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
        const response = result as CaixaResponse;

        return NextResponse.json(response, {
            status: response.success ? 200 : 422,
        });
    } catch (error) {
        console.error('[POST /api/caixa] Erro inesperado:', error);
        return NextResponse.json<CaixaResponse>(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Erro ao lançar o fechamento.',
            },
            { status: 500 }
        );
    }
}

/**
 * Mantém a exclusão fora do transporte de Server Actions pelo mesmo motivo
 * do lançamento: o cliente recebe um JSON tratável, em vez de um erro RSC
 * genérico quando o servidor falha ao processar a ação.
 */
export async function DELETE(request: Request) {
    try {
        const body: unknown = await request.json();
        const id = typeof body === 'object' && body !== null && 'id' in body
            ? (body as { id?: unknown }).id
            : undefined;
        const result = await deleteCaixaAction(id as string);
        const response = result as CaixaResponse;

        return NextResponse.json(response, {
            status: response.success ? 200 : 422,
        });
    } catch (error) {
        console.error('[DELETE /api/caixa] Erro inesperado:', error);
        return NextResponse.json<CaixaResponse>(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Erro ao excluir o fechamento.',
            },
            { status: 500 }
        );
    }
}
