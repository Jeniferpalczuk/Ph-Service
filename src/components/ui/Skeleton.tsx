import React from 'react';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    variant?: 'text' | 'rect' | 'circle';
}

/**
 * Skeleton Loader - Fase 4
 * 
 * Um componente elegante para loading state.
 * Substitui o texto "Carregando..." por formas animadas que imitam o conteúdo.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    width,
    height,
    variant = 'rect'
}) => {
    const style: React.CSSProperties = {
        width,
        height,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: variant === 'circle' ? '50%' : variant === 'text' ? '4px' : '8px',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
    };

    return (
        <div
            className={`skeleton-loader ${className}`}
            style={style}
        />
    );
};

/**
 * TableSkeleton - Fase 4
 * 
 * Renderiza uma tabela fake animada enquanto os dados reais carregam.
 */
export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => {
    return (
        <div style={{ width: '100%' }}>
            {/* Headers */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} height={30} width={`${100 / cols}%`} />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <Skeleton key={j} height={20} width={`${100 / cols}%`} />
                    ))}
                </div>
            ))}
        </div>
    );
};

// CSS inline para garantir que a animação funcione sem depender de arquivos externos iniciais
export const SkeletonStyles = () => (

    <style>{`
        @keyframes skeleton-pulse {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
        }
        .skeleton-loader {
            display: inline-block;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
    `}</style>
);
