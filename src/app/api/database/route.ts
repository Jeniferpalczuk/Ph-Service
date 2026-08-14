import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic'; // Disable caching

const DB_PATH = path.join(process.cwd(), 'db.json');

type DatabaseSnapshot = {
    [key: string]: unknown;
    theme?: 'light' | 'dark';
};

// Helper para ler BD
async function getDB(): Promise<DatabaseSnapshot> {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data) as DatabaseSnapshot;
    } catch {
        // Se falhar (arquivo não existe), retorna objeto vazio ou padrão
        return {
            convenios: [], boletos: [], caixa: [], saidas: [], vales: [],
            marmitas: [], folhaPagamento: [], outrosServicos: [], funcionarios: [],
            clientes: [], fechamentosCaixa: [], fornecedores: [], theme: 'light'
        };
    }
}

// Helper para salvar
async function saveDB(data: DatabaseSnapshot) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
    const data = await getDB();
    return NextResponse.json(data);
}

export async function POST(req: Request) {
    try {
        const body = await req.json() as DatabaseSnapshot;
        /*
          Esperamos body no formato:
          { collection: 'marmitas', data: [...] }
          OU
          { theme: 'dark' }
        */
        const currentDB = await getDB();

        let updated = false;

        if (typeof body.collection === 'string') {
            currentDB[body.collection] = body.data;
            updated = true;
        }

        if (body.theme) {
            currentDB.theme = body.theme;
            updated = true;
        }

        if (updated) {
            await saveDB(currentDB);
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'No valid data provided' }, { status: 400 });
        }
    } catch (error) {
        console.error('Database write error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
