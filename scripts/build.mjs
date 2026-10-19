import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { layout } from '../src/layouts/site.mjs';
import { homePage } from '../src/pages/home.mjs';
import { aboutPage } from '../src/pages/about.mjs';
import { projectPage } from '../src/pages/project.mjs';
import { contentPage } from '../src/pages/content.mjs';
import { designPage } from '../src/pages/design.mjs';
import { makeUrl, escapeHtml } from '../src/lib/html.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

async function sectionsFor(id) {
  const directory = `src/content/${id}`;
  const manifest = await json(`${directory}/index.json`);
  const sections = await Promise.all(manifest.sections.map(file => {
    if (!/^[a-z0-9.-]+\.json$/.test(file)) throw new Error(`Invalid section filename: ${file}`);
    return json(`${directory}/${file}`);
  }));
  const ids = sections.map(s => s.id);
  if (new Set(ids).size !== ids.length) throw new Error(`Duplicate section IDs: ${id}`);
  return sections;
}

export async function build() {
  const output = path.join(root, 'dist');
  const site = await json('src/data/site.json');
  const basePath = process.env.SITE_BASE_PATH || '';
  const url = makeUrl(basePath);
  if (process.env.SITE_URL) site.url = process.env.SITE_URL.replace(/\/$/, '');
  const projects = (await json('src/data/projects.json')).filter(p => p.published !== false);
  const generalPages = (await json('src/data/pages.json')).filter(p => p.published !== false);
  const paths = [...projects, ...generalPages].map(p => p.path);
  if (new Set(paths).size !== paths.length || new Set(projects.map(p => p.id)).size !== projects.length) throw new Error('Project IDs and paths must be unique.');
  if (!generalPages.some(p => p.path === '/' && p.template === 'home')) throw new Error('A published homepage is required.');
  for (const page of generalPages) {
    if (!/^\/(?:[a-zA-Z0-9.-]+\/)*$/.test(page.path) || !/^[a-z0-9-]+$/.test(page.id)) throw new Error(`Invalid page route: ${page.id}`);
  }
  // Unpublishing a page also removes its link from shared navigation.
  site.navigation = site.navigation.filter(item => !item.href.startsWith('/') || paths.includes(item.href.split('#')[0]));
  for (const project of projects) {
    if (!/^\/work\/[a-zA-Z0-9.-]+\/$/.test(project.path) || !/^[a-z0-9-]+$/.test(project.id)) throw new Error(`Invalid project route: ${project.id}`);
  }
  await fs.rm(output, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });
  await fs.cp(path.join(root, 'public'), output, { recursive: true });
  await fs.copyFile(path.join(root, 'src/styles/site.css'), path.join(output, 'assets/site.css'));
  await fs.copyFile(path.join(root, 'src/scripts/site.js'), path.join(output, 'assets/site.js'));
  await fs.cp(path.join(root, 'src/styles/design'), path.join(output, 'assets/design'), {recursive:true});
  await fs.copyFile(path.join(root, 'src/styles/design.css'), path.join(output, 'assets/design.css'));
  await fs.copyFile(path.join(root, 'src/scripts/design.js'), path.join(output, 'assets/design.js'));
  const hasDesign = async id => fs.access(path.join(root, `src/design/pages/${id}/index.json`)).then(()=>true,()=>false);
  const renderDesign = id => designPage(id, {root,url,site,projects,pages:generalPages});
  const pages = [];
  async function writePage(route, options) {
    const filename = route === '/404.html' ? '404.html' : `${route.slice(1)}index.html`;
    const destination = path.join(output, filename);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, layout({ site, path: route, url, ...options }));
    pages.push(route);
  }
  for (const page of generalPages) {
    let body;
    const restored = await hasDesign(page.id);
    if (restored) body = await renderDesign(page.id);
    else if (page.template === 'home') body = homePage(await json('src/content/home.json'), projects, site, url);
    else if (page.template === 'about') body = aboutPage(await sectionsFor(page.id), site, url);
    else if (page.template === 'content') body = contentPage(page, await sectionsFor(page.id), url);
    else throw new Error(`Unknown page template: ${page.template}`);
    await writePage(page.path, { title: page.title || site.title, description: page.description || site.description, kind: page.template, body, restored, image: page.template === 'home' ? projects[0]?.cover : undefined });
  }
  for (const project of projects) {
    const restored = await hasDesign(project.id);
    await writePage(project.path, { title: `${project.name} — ${site.name}`, description: project.summary, kind: 'project', image: project.cover, restored, body: restored ? await renderDesign(project.id) : projectPage(project, await sectionsFor(project.id), projects, url) });
  }
  await writePage('/404.html', { title: `Page not found — ${site.name}`, description: 'This page is no longer available.', body: `<section class="not-found"><p class="eyebrow">404</p><h1>Let's find your way back.</h1><p>This page may have moved. Explore the selected work or get in touch.</p><a class="button" href="${url('/#works')}">View selected work →</a></section>` });
  await fs.writeFile(path.join(output, '.nojekyll'), '');
  await fs.writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.filter(p => p !== '/404.html').map(p => `<url><loc>${escapeHtml(site.url + p)}</loc></url>`).join('')}</urlset>`);
  await fs.writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
  console.log(`Built ${pages.length} pages in dist/ (base path: ${basePath || '/'}).`);
  return { output, pages };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await build();
