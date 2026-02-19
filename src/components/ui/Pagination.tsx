import React from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPrefetch?: (page: number) => void;
    isLoading?: boolean;
}

/**
 * Componente de Paginação Padronizado
 * Com suporte a prefetch ao passar o mouse.
 */
export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    onPrefetch,
    isLoading = false
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const handlePrevious = () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    };

    const handleMouseEnterPrevious = () => {
        if (onPrefetch && currentPage > 1) {
            onPrefetch(currentPage - 1);
        }
    };

    const handleMouseEnterNext = () => {
        if (onPrefetch && currentPage < totalPages) {
            onPrefetch(currentPage + 1);
        }
    };

    return (
        <div className="flex items-center justify-center gap-4 py-6 border-t border-slate-100 mt-4">
            <button
                onClick={handlePrevious}
                onMouseEnter={handleMouseEnterPrevious}
                disabled={currentPage === 1 || isLoading}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <LuChevronLeft className="w-4 h-4 mr-1" />
                Anterior
            </button>

            <span className="text-sm font-medium text-slate-600">
                Página <span className="text-slate-900 font-bold">{currentPage}</span> de <span className="text-slate-900 font-bold">{totalPages}</span>
            </span>

            <button
                onClick={handleNext}
                onMouseEnter={handleMouseEnterNext}
                disabled={currentPage === totalPages || isLoading}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Próxima
                <LuChevronRight className="w-4 h-4 ml-1" />
            </button>
        </div>
    );
}
