import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from './build.mjs';

const output = path.join(root, 'dist');
const basePath = (process.env.SITE_BASE_PATH || '').replace(/\/$/, '');
const files = [];
async function walk(directory) { for (const item of await fs.readdir(directory, { withFileTypes: true })) { const file = path.join(directory, item.name); if (item.isDirectory()) await walk(file); else files.push(file); } }
await walk(output);
const knownFiles = new Set(files);
const htmlFiles = files.filter(f => f.endsWith('.html'));
const documents = new Map(await Promise.all(htmlFiles.map(async f => [f, await fs.readFile(f, 'utf8')])));
const errors = []; let linkCount = 0;
for (const [file, html] of documents) {
  const label = path.relative(output, file);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  if (new Set(ids).size !== ids.length) errors.push(`${label}: duplicate element IDs`);
  if ((html.match(/<h1[ >]/g) || []).length !== 1) errors.push(`${label}: expected one h1`);
  if (html.includes('<a>')) errors.push(`${label}: anchor without a destination`);
  if (/framerusercontent\.com|app\.framerstatic\.com|events\.framer\.com/.test(html)) errors.push(`${label}: still depends on Framer`);
  const references=[...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match=>match[1]);
  for(const match of html.matchAll(/\bsrcset="([^"]+)"/g)) references.push(...match[1].split(',').map(candidate=>candidate.trim().split(/\s+/)[0]));
  for (const reference of references) {
    const ref = reference.replaceAll('&amp;', '&');
    if (!ref || /^(https?:|mailto:|tel:|data:|\/\/)/.test(ref)) continue;
    linkCount++;
    const currentRoute = '/' + path.relative(output, file).replaceAll(path.sep, '/');
    const destination = new URL(ref, `https://local.invalid${basePath}${currentRoute}`);
    let pathname = decodeURIComponent(destination.pathname);
    if (basePath) {
      if (!pathname.startsWith(`${basePath}/`)) { errors.push(`${label}: missing base path in ${ref}`); continue; }
      pathname = pathname.slice(basePath.length);
    }
    let target = path.join(output, pathname.slice(1));
    if (!knownFiles.has(target)) target = path.join(target, 'index.html');
    if (!knownFiles.has(target)) { errors.push(`${label}: missing ${ref}`); continue; }
    if (destination.hash && documents.has(target)) {
      const id = decodeURIComponent(destination.hash.slice(1));
      if (!documents.get(target).includes(`id="${id}"`) && !documents.get(target).includes(`data-anchor="${id}"`)) errors.push(`${label}: missing anchor ${ref}`);
    }
  }
}
for (const file of files) {
  const stat = await fs.stat(file);
  if (stat.size > 95 * 1024 * 1024) errors.push(`${path.relative(output, file)} exceeds safe GitHub file size`);
}
for (const file of files.filter(f=>f.endsWith('.css'))) {
  const css=await fs.readFile(file,'utf8');
  for(const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)){
    if(/^(data:|#)/.test(match[1]))continue;
    if(/^https?:/.test(match[1])){errors.push(`${path.relative(output,file)}: external style asset ${match[1]}`);continue;}
    const target=path.resolve(path.dirname(file),match[1]);
    if(!knownFiles.has(target))errors.push(`${path.relative(output,file)}: missing style asset ${match[1]}`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`PASS: ${htmlFiles.length} pages, ${linkCount} local links/assets, all section anchors, no Framer runtime dependencies.`);
