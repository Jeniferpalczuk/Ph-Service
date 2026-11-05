// Local UI sandbox: disposable in-memory rows, no access to the real database.
import { createServer } from 'node:http';
const port = Number(process.env.MOCK_SUPABASE_PORT || 3150);
const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'test@example.test', user_metadata: { name: 'Teste local' }, app_metadata: {} };
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const expires = Math.floor(Date.now() / 1000) + 86400;
const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: 'authenticated', role: 'authenticated', exp: expires, email: user.email })}.test-signature`;
const tables = {
    clientes: [{ id: '22222222-2222-4222-8222-222222222222', nome: 'Empresa Teste', tipo: 'empresa', ativo: true }],
    convenios: [],
};
const server = createServer(async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', request.headers.origin || '*');
    response.setHeader('Access-Control-Allow-Headers', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    response.setHeader('Access-Control-Expose-Headers', 'Content-Range');
    response.setHeader('Content-Type', 'application/json');
    if (request.method === 'OPTIONS') { response.end(); return; }
    const url = new URL(request.url, `http://localhost:${port}`);
    let body = '';
    for await (const chunk of request) body += chunk;
    const send = (data, status = 200) => { response.statusCode = status; response.end(JSON.stringify(data)); };
    if (url.pathname === '/auth/v1/token') {
        send({ access_token: token, refresh_token: 'local-test-refresh', token_type: 'bearer', expires_in: 86400, expires_at: expires, user });
        return;
    }
    if (url.pathname === '/auth/v1/user') { send(user); return; }
    if (url.pathname === '/auth/v1/logout') { send({}); return; }
    if (!url.pathname.startsWith('/rest/v1/')) { send({ error: 'Not found' }, 404); return; }
    const name = url.pathname.slice('/rest/v1/'.length);
    tables[name] ||= [];
    let rows = tables[name].filter(row => {
        for (const [key, value] of url.searchParams) {
            if (value.startsWith('eq.') && String(row[key]) !== value.slice(3)) return false;
            if (value.startsWith('gte.') && String(row[key]) < value.slice(4)) return false;
            if (value.startsWith('lte.') && String(row[key]) > value.slice(4)) return false;
        }
        return true;
    });
    if (request.method === 'POST') {
        const record = JSON.parse(body);
        // Deterministic failure scenario for verifying that the form stays open.
        if (name === 'convenios' && record.banco === 'ERRO') {
            send({ code: '23502', message: 'Missing required test field' }, 400); return;
        }
        rows = [{ ...record, id: record.id || crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
        tables[name].push(...rows);
    }
    if (request.method === 'PATCH') rows.forEach(row => Object.assign(row, JSON.parse(body)));
    if (request.method === 'DELETE') tables[name] = tables[name].filter(row => !rows.includes(row));
    response.setHeader('Content-Range', rows.length ? `0-${rows.length - 1}/${rows.length}` : '*/0');
    send(request.headers.accept?.includes('vnd.pgrst.object') ? rows[0] || null : rows);
});
server.listen(port, '127.0.0.1', () => console.log(`Local Supabase fixture: http://127.0.0.1:${port}`));
