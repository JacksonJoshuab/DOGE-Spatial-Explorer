#!/usr/bin/env node
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';

const root = path.resolve(process.env.SITE_DIR || 'gonzo-health-spatial-cognition');
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const cert = fs.readFileSync(process.env.TLS_CERT || '/tmp/gonzo-server.crt');
const key = fs.readFileSync(process.env.TLS_KEY || '/tmp/gonzo-server.key');
const mime = new Map([
  ['.html','text/html; charset=utf-8'],['.mjs','text/javascript; charset=utf-8'],['.js','text/javascript; charset=utf-8'],
  ['.css','text/css; charset=utf-8'],['.json','application/json; charset=utf-8'],['.webmanifest','application/manifest+json'],
  ['.svg','image/svg+xml'],['.txt','text/plain; charset=utf-8'],['.png','image/png'],['.ico','image/x-icon']
]);

function resolveRequest(requestURL) {
  const raw = decodeURIComponent(new URL(requestURL, `https://${host}:${port}`).pathname);
  const relative = raw.replace(/^\/+/, '');
  const candidate = path.resolve(root, relative || 'index.html');
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) return null;
  try {
    const stat = fs.statSync(candidate);
    return stat.isDirectory() ? path.join(candidate, 'index.html') : candidate;
  } catch { return candidate; }
}

https.createServer({ cert, key }, (req, res) => {
  if (!['GET','HEAD'].includes(req.method || '')) { res.writeHead(405); return res.end(); }
  const file = resolveRequest(req.url || '/');
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'content-type':'text/plain; charset=utf-8', 'cache-control':'no-store' });
    return res.end('Not found');
  }
  const headers = {
    'content-type': mime.get(path.extname(file).toLowerCase()) || 'application/octet-stream',
    'cache-control':'no-store',
    'x-content-type-options':'nosniff'
  };
  const stat = fs.statSync(file); headers['content-length'] = String(stat.size);
  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}).listen(port, host, () => {
  console.log(`Serving ${root} at https://${host}:${port}/`);
});
