import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PDFParse } from 'pdf-parse';

export type BoletoPdfPreview = {
    tempId: string;
    cliente: string;
    valor: number;
    banco: string;
    dataVencimento: string;
    dataPagamento: string | null;
    statusPagamento: 'pendente' | 'pago';
    observacoes: string | null;
    confidence: number;
    warnings: string[];
    rawTextPreview: string;
};

const KNOWN_BANKS = [
    'Banco do Brasil',
    'Bradesco',
    'Itau',
    'Itaú',
    'Santander',
    'Caixa',
    'Caixa Economica Federal',
    'Caixa Econômica Federal',
    'Sicredi',
    'Sicoob',
    'Inter',
    'Nubank',
    'Safra',
    'BTG',
    'Banrisul',
    'Mercantil',
    'C6 Bank',
];

const DATE_PATTERN = /(\d{2}[\/.-]\d{2}[\/.-]\d{4})/g;
const MONEY_PATTERN = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/g;

let pdfWorkerConfigured = false;

function ensurePdfWorker() {
    if (pdfWorkerConfigured) return;

    const workerPath = join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
    PDFParse.setWorker(pathToFileURL(workerPath).toString());
    pdfWorkerConfigured = true;
}

function normalizeWhitespace(value: string) {
    return value.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function toAscii(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseBrazilianMoney(value: string) {
    const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

function parseBrazilianDate(value: string) {
    const [day, month, year] = value.split(/[\/.-]/).map(Number);
    if (!day || !month || !year) return null;

    const date = new Date(year, month - 1, day, 12, 0, 0);
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function findKnownBank(text: string) {
    const plain = toAscii(text).toLowerCase();
    const found = KNOWN_BANKS.find((bank) => plain.includes(toAscii(bank).toLowerCase()));
    if (found) return found === 'Itau' ? 'Itaú' : found;

    const bankMatch = text.match(/(?:banco|institui[cç][aã]o financeira)[:\s-]+([A-Za-zÀ-ÿ0-9 .&-]{2,50})/i);
    return bankMatch?.[1]?.trim().replace(/\s{2,}/g, ' ') ?? '';
}

function findValue(text: string) {
    const labelMatches = Array.from(
        text.matchAll(/(?:valor (?:do documento|cobrado|a pagar)|total (?:a pagar)?|valor)[:\s-]{0,20}(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/gi)
    );

    const labeledValues = labelMatches
        .map((match) => parseBrazilianMoney(match[1]))
        .filter((value): value is number => value !== null && value > 0);

    if (labeledValues.length > 0) {
        return labeledValues[labeledValues.length - 1];
    }

    const values = Array.from(text.matchAll(MONEY_PATTERN))
        .map((match) => parseBrazilianMoney(match[1]))
        .filter((value): value is number => value !== null && value > 0);

    if (values.length === 0) return 0;
    return values.sort((a, b) => b - a)[0];
}

function findDateByLabels(text: string, labels: string[]) {
    const plainLines = text.split('\n').map((line) => line.trim()).filter(Boolean);

    for (const label of labels) {
        const labelPattern = new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\n]{0,80}${DATE_PATTERN.source}`, 'i');
        const directMatch = text.match(labelPattern);
        const directDate = directMatch?.[1] ? parseBrazilianDate(directMatch[1]) : null;
        if (directDate) return directDate;

        const lineIndex = plainLines.findIndex((line) => toAscii(line).toLowerCase().includes(toAscii(label).toLowerCase()));
        if (lineIndex >= 0) {
            const nearby = plainLines.slice(lineIndex, lineIndex + 3).join(' ');
            const nearbyDate = nearby.match(DATE_PATTERN)?.[0];
            const parsed = nearbyDate ? parseBrazilianDate(nearbyDate) : null;
            if (parsed) return parsed;
        }
    }

    return null;
}

function findFirstDate(text: string) {
    const match = text.match(DATE_PATTERN)?.[0];
    return match ? parseBrazilianDate(match) : null;
}

function cleanPersonName(value: string) {
    return value
        .replace(/\b(cnpj|cpf|ag[eê]ncia|codigo|c[oó]digo|data|valor)\b.*$/i, '')
        .replace(/[:|]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, 100);
}

function findCliente(text: string) {
    const labels = ['beneficiário', 'beneficiario', 'cedente', 'favorecido', 'recebedor'];
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);

    for (const label of labels) {
        const labelPattern = new RegExp(`${label}[:\\s-]+([^\\n]{2,100})`, 'i');
        const directMatch = text.match(labelPattern);
        const directName = directMatch?.[1] ? cleanPersonName(directMatch[1]) : '';
        if (directName.length >= 2) return directName;

        const lineIndex = lines.findIndex((line) => toAscii(line).toLowerCase().includes(toAscii(label).toLowerCase()));
        if (lineIndex >= 0) {
            const sameLine = cleanPersonName(lines[lineIndex].replace(new RegExp(label, 'i'), ''));
            if (sameLine.length >= 2) return sameLine;

            const nextLine = cleanPersonName(lines[lineIndex + 1] ?? '');
            if (nextLine.length >= 2) return nextLine;
        }
    }

    return 'Importado do PDF';
}

function confidenceScore(preview: Omit<BoletoPdfPreview, 'confidence'>) {
    let score = 0;
    if (preview.cliente && preview.cliente !== 'Importado do PDF') score += 25;
    if (preview.valor > 0) score += 30;
    if (preview.banco) score += 20;
    if (preview.dataVencimento) score += 25;
    return score;
}

function buildPreview(text: string, index: number): BoletoPdfPreview {
    const normalized = normalizeWhitespace(text);
    const dataVencimento =
        findDateByLabels(normalized, ['vencimento', 'data de vencimento', 'pagar até', 'pagar ate']) ??
        findDateByLabels(normalized, ['pagamento', 'data de pagamento']) ??
        findFirstDate(normalized) ??
        '';
    const dataPagamento = findDateByLabels(normalized, ['data de pagamento', 'pagamento']);

    const previewWithoutConfidence = {
        tempId: `pdf-${Date.now()}-${index}`,
        cliente: findCliente(normalized),
        valor: findValue(normalized),
        banco: findKnownBank(normalized),
        dataVencimento,
        dataPagamento: dataPagamento === dataVencimento ? null : dataPagamento,
        statusPagamento: 'pendente' as const,
        observacoes: 'Importado de PDF',
        warnings: [] as string[],
        rawTextPreview: normalized.slice(0, 600),
    };

    const warnings = [];
    if (previewWithoutConfidence.cliente === 'Importado do PDF') warnings.push('Fornecedor não identificado');
    if (!previewWithoutConfidence.banco) warnings.push('Banco não identificado');
    if (!previewWithoutConfidence.dataVencimento) warnings.push('Data não identificada');
    if (!previewWithoutConfidence.valor) warnings.push('Valor não identificado');

    const confidence = confidenceScore({ ...previewWithoutConfidence, warnings });

    return {
        ...previewWithoutConfidence,
        warnings,
        confidence,
    };
}

function splitPotentialBoletos(text: string) {
    const normalized = normalizeWhitespace(text);
    const parts = normalized
        .split(/(?=Ficha de Compensa[cç][aã]o|Recibo do Pagador|Linha Digit[aá]vel|C[oó]digo de Barras)/i)
        .map((part) => part.trim())
        .filter((part) => part.length > 120);

    if (parts.length <= 1) return [normalized];

    const uniqueParts = new Map<string, string>();
    for (const part of parts) {
        const value = findValue(part);
        const date = findDateByLabels(part, ['vencimento', 'data de vencimento']) ?? findFirstDate(part);
        const key = `${value}-${date}-${findKnownBank(part)}-${findCliente(part)}`;
        if (!uniqueParts.has(key)) uniqueParts.set(key, part);
    }

    return Array.from(uniqueParts.values());
}

export async function parseBoletosPdf(fileBuffer: Buffer): Promise<BoletoPdfPreview[]> {
    ensurePdfWorker();

    const parser = new PDFParse({ data: new Uint8Array(fileBuffer) });

    try {
        const result = await parser.getText();
        const text = normalizeWhitespace(result.text);

        if (text.length < 40) {
            throw new Error('Não foi possível extrair texto do PDF. O arquivo pode estar escaneado como imagem.');
        }

        return splitPotentialBoletos(text)
            .map((part, index) => buildPreview(part, index))
            .filter((preview) => preview.valor > 0 || preview.dataVencimento || preview.banco);
    } finally {
        await parser.destroy();
    }
}
