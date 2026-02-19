'use client';

import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('GlobalErrorBoundary');

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to our logging service
        logger.error('Unhandled app error:', { digest: error.digest }, error);
    }, [error]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: 'var(--background-default, #f5f5f5)',
            color: 'var(--text-primary, #333)'
        }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                Ops! Algo deu errado.
            </h2>
            <p style={{ marginBottom: '2rem', maxWidth: '500px' }}>
                Pedimos desculpas pelo inconveniente. Um erro inesperado ocorreu.
                Nossa equipe técnica foi notificada.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'var(--primary-color, #007bff)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    Tentar Novamente
                </button>
                <button
                    onClick={() => window.location.href = '/'}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border-color, #ccc)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    Voltar ao Início
                </button>
            </div>
        </div>
    );
}
