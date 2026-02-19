import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h2 className="text-2xl font-bold mb-4">Página não encontrada</h2>
            <p className="mb-8">Não conseguimos encontrar o recurso solicitado.</p>
            <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Voltar ao início
            </Link>
        </div>
    );
}
