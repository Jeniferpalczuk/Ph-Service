import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

// Exercise the real production action bundles without a session or database writes.
// /login bypasses auth middleware, so the action itself must reject the request.
const port = Number(process.env.TEST_PORT || 3149);
const base = `http://localhost:${port}`;
const manifest = JSON.parse(readFileSync('.next/server/server-reference-manifest.json', 'utf8'));
const server = spawn(process.execPath, ['--import', './tests/fixtures/no-pdf.mjs', 'node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
});
let output = '';
server.stdout.on('data', chunk => { output += chunk; });
server.stderr.on('data', chunk => { output += chunk; });
try {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
        if (server.exitCode !== null) throw new Error(`Server exited: ${output}`);
        try {
            const response = await fetch(`${base}/login`);
            if (response.ok) { ready = true; break; }
        } catch { /* Server is starting. */ }
        await delay(500);
    }
    assert.ok(ready, 'Production server did not start');
    for (const name of [
        'createBoletoAction', 'updateBoletoAction', 'deleteBoletoAction',
        'analisarBoletoPdfAction',
    ]) {
        const entry = Object.entries(manifest.node).find(([, action]) =>
            action.workers['app/login/page']?.exportedName === name);
        assert.ok(entry, `Missing action: ${name}`);
        const response = await fetch(`${base}/login`, {
            method: 'POST',
            headers: { 'Next-Action': entry[0], Origin: base, 'Content-Type': 'text/plain;charset=UTF-8' },
            body: JSON.stringify([{}]),
        });
        const body = await response.text();
        assert.equal(response.status, 200, `${name}: HTTP ${response.status}\n${output}`);
        assert.match(body, /"success":false/, `${name}: must return a structured error`);
        assert.match(body, /Não autorizado|sessão/, `${name}: authentication must remain enforced`);
        assert.doesNotMatch(body, /DOMMatrix|Server Components render/);
        console.log(`PASS production bundle: ${name}`);
    }
} finally {
    server.kill();
}
