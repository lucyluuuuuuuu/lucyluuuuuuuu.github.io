import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from './build.mjs';

const { output } = await build();
const port = Number(process.env.PORT || 4173);
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.webp':'image/webp', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.xml':'application/xml', '.txt':'text/plain' };
http.createServer(async (req, res) => {
  try {
    const requested = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname);
    let filename = path.resolve(output, `.${requested}`);
    if (!filename.startsWith(`${output}${path.sep}`) && filename !== output) { res.writeHead(403); res.end(); return; }
    try { if ((await fs.stat(filename)).isDirectory()) filename = path.join(filename, 'index.html'); }
    catch { filename = path.join(output, '404.html'); res.statusCode = 404; }
    res.setHeader('Content-Type', mime[path.extname(filename)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(await fs.readFile(filename));
  } catch { res.writeHead(500); res.end('Could not serve this file.'); }
}).listen(port, '127.0.0.1', () => console.log(`Local preview: http://127.0.0.1:${port}`));
