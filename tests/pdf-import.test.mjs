import assert from 'node:assert/strict';
import test from 'node:test';

function samplePdf() {
    const content = 'BT /F1 12 Tf 40 780 Td (Cliente: Empresa Teste) Tj 0 -20 Td (Banco do Brasil) Tj 0 -20 Td (Valor do documento: 1.239,00) Tj 0 -20 Td (Vencimento: 17/09/2026) Tj ET';
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
        offsets.push(Buffer.byteLength(pdf));
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = Buffer.byteLength(pdf);
    pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(pdf);
}

test('importing the PDF helper does not initialize PDF.js or require DOM APIs', async () => {
    assert.equal(typeof globalThis.DOMMatrix, 'undefined');
    const { parseBoletosPdf } = await import('../src/lib/boletos/pdf-import.ts');
    assert.equal(typeof parseBoletosPdf, 'function');
    assert.equal(typeof globalThis.DOMMatrix, 'undefined');
});

test('extracts a real PDF in Node after initializing the canvas and bundled worker', async () => {
    const { parseBoletosPdf } = await import('../src/lib/boletos/pdf-import.ts');
    const results = await parseBoletosPdf(samplePdf());
    assert.equal(results.length, 1);
    assert.equal(results[0].valor, 1239);
    assert.equal(results[0].dataVencimento, '2026-09-17');
    assert.equal(results[0].banco, 'Banco do Brasil');
});
