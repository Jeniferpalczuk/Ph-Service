// Simulate a serverless runtime without PDF/canvas support. Ordinary actions
// must still load and enforce authentication without touching these packages.
import Module from 'node:module';
const originalLoad = Module._load;
Module._load = function (request, ...args) {
    if (/^(pdf-parse|pdfjs-dist|@napi-rs\/canvas)(\/|$)/.test(request)) {
        throw new Error('PDF dependencies deliberately unavailable in this regression test');
    }
    return originalLoad.call(this, request, ...args);
};
