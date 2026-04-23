// Local dev server — proxied by Vite on /api
// Reads SMTP_PASSWORD (and other vars) from .env.local
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const raw = readFileSync(join(__dirname, '.env.local'), 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    process.env[key] = val;
  }
  console.log('Loaded .env.local');
} catch {
  console.log('No .env.local found — set env vars manually');
}

const { default: handler } = await import('./api/send-rmcp.js');

const CORS = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/send-rmcp') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try { req.body = JSON.parse(body); } catch { req.body = {}; }

      const mockRes = {
        _status: 200,
        status(code) { this._status = code; return this; },
        json(data) {
          res.writeHead(this._status, { 'Content-Type': 'application/json', ...CORS });
          res.end(JSON.stringify(data));
        },
      };

      await handler(req, mockRes);
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Dev API server: http://localhost:${PORT}`);
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || 'mail01.1-grid.com (default)'}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER || 'bigbayad@bigbayadmin.co.za (default)'}`);
  console.log(`SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '***set***' : 'NOT SET — add to .env.local'}`);
});
