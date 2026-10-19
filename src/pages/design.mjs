import fs from 'node:fs/promises';
import path from 'node:path';
import { escapeHtml as e } from '../lib/html.mjs';

// The layout files are ordinary, nested HTML descriptions, with copy and routes
// stored separately. No editor SDK, React runtime or remote asset is required.
export async function designPage(id, { root, url, site, projects, pages }) {
  const json = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
  const [manifest, copy, routeIds, anchors, menus, originalProjects] = await Promise.all([
    json(`src/design/pages/${id}/index.json`), json('src/content/design-copy.json'),
    json('src/design/routes.json'), json('src/design/anchors.json'), json('src/design/navigation-open.json'), json('src/design/project-defaults.json'),
  ]);
  const allPages = [...pages, ...projects], parts = new Map();
  const originalPaths = {'/':'home','/About-lucy-lu/':'about',...Object.fromEntries(originalProjects.map(p=>[p.path,p.id]))};
  let serial = 0;
  const rules = new Set();
  const unitless = new Set(['opacity', 'zIndex', 'fontWeight', 'lineHeight', 'flex', 'flexGrow', 'flexShrink', 'order', 'scale']);
  function styles(input = {}) {
    const output = [], transforms = [];
    for (const [key, value] of Object.entries(input)) {
      if (value == null || typeof value === 'object' || key === 'transition') continue;
      if (['rotate', 'rotateX', 'rotateY', 'skewX', 'skewY'].includes(key)) { if(value) transforms.push(`${key}(${value}deg)`); continue; }
      if (['x','y'].includes(key)) { if(value) transforms.push(`translate${key.toUpperCase()}(${typeof value === 'number' ? value + 'px' : value})`); continue; }
      if (key === 'scale') { if(value !== 1) transforms.push(`scale(${value})`); continue; }
      if (['transformPerspective','originX','originY'].includes(key)) continue;
      const property = key.startsWith('--') ? key : key.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
      output.push(`${property}:${typeof value === 'number' && value !== 0 && !key.startsWith('--') && !unitless.has(key) ? value + 'px' : value}`);
    }
    if(transforms.length) output.push(`transform:${transforms.join(' ')}`);
    return output.join(';');
  }
  function destination(link) {
    if (!link) return null;
    if (typeof link === 'object') {
      const page = allPages.find(p => p.id === routeIds[link.webPageId]);
      if (!page) return false;
      const fragment = link.hash?.replace(/^:/, '');
      return url(page.path + (fragment ? '#' + (anchors[fragment] || fragment) : ''));
    }
    if(link.startsWith('mailto:')) return 'mailto:' + site.email;
    if(link.includes('instagram.com')) return site.instagram;
    if(link.includes('acrobat.adobe.com')) return site.resume;
    if(link.startsWith('/')) {
      const [pathname,fragment]=link.split('#'),originalId=originalPaths[pathname];
      if(originalId){
        const page=allPages.find(p=>p.id===originalId);
        if(!page)return false;
        return url(page.path+(fragment?'#'+fragment:''));
      }
      return url(link);
    }
    return link;
  }
  const icons = {
    EnvelopeSimple: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 6 9 7 9-7"/>',
    InstagramLogo: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/>',
    ArrowUpRight: '<path d="M5 19 19 5M5 5h14v14"/>',
    ArrowUp: '<path d="m5 10 7-7 7 7M12 3v18"/>',
  };
  async function render(node, ctx) {
    if (node == null) return '';
    if (Array.isArray(node)) { const result=[]; for(const child of node)result.push(await render(child,ctx)); return result.join(''); }
    if (typeof node === 'string') return e(node);
    if (node.text) {
      const original = copy[node.text] ?? '';
      return e(ctx.menuLabel ?? ctx.replacements?.[original] ?? original);
    }
    if (node.include) {
      if(!parts.has(node.include)) parts.set(node.include, json(`src/design/components/${node.include}.json`));
      return render(await parts.get(node.include),ctx);
    }
    const dest = node.cardDestination || destination(node.link);
    if(dest === false) return '';
    const uid = `d-${ctx.profile}-${++serial}`;
    let tag = node.tag || 'div', attributes = '', className = node.class || '';
    if(node.cardDestination) className+=' project-entry';
    const style = { ...node.style };
    const context = {...ctx};
    if (node.component) { context.hoverRoot = uid; attributes += ` data-component="${e(node.component)}"`; }
    if(node.component==='menu-item'&&dest?.startsWith('/')){
      const item=site.navigation.find(item=>url(item.href)===dest);
      if(item)context.menuLabel=item.label;
    }
    if (dest && !ctx.inLink) { tag = 'a'; attributes += ` href="${e(dest)}"`; context.inLink = true; if(node.newTab) attributes += ' target="_blank" rel="noopener noreferrer"'; }
    else if (tag === 'a') tag = 'span';
    if(node.action) { tag = 'button'; attributes += ` type="button" data-action="${node.action}" aria-label="${node.action === 'open-menu' ? 'Open menu' : 'Close menu'}" aria-expanded="${node.action === 'close-menu'}"`; }
    if(node.border) attributes += ' data-border="true"';
    if(node.label) attributes += ` data-layer="${e(node.label)}"`;
    if(node.anchor) attributes += ` data-anchor="${e(node.anchor)}"`;
    attributes += ` id="${uid}"`;
    if(node.hover || node.pressed) {
      const scope = context.hoverRoot || uid;
      const selector = scope === uid ? `#${uid}` : `#${scope}`;
      for(const [state,values] of [[':is(:hover,:focus-within)',node.hover],[':active',node.pressed]]) if(values) {
        rules.add(`${selector}${state}${scope === uid ? '' : ' #' + uid}{${styles(values).split(';').filter(Boolean).map(s => s + '!important').join(';')}}`);
      }
    }
    if(node.appear) attributes += ` data-appear="${e(JSON.stringify(node.appear))}"`;
    if(node.rich) { className += ' design-text'; attributes += ` data-align="${e(node.align || 'top')}"`; }
    let children = '';
    if(node.image) {
      className += ' design-image';
      children = `<img src="${e(url(ctx.replacements?.[node.image.src] || node.image.src))}" alt="${e(node.image.alt)}" draggable="false" loading="${ctx.section < 3 ? 'eager' : 'lazy'}" decoding="async" style="object-fit:${e(node.image.fit)};object-position:${e(node.image.position)}">`;
    } else if(node.svg) {
      className += ' design-svg';
      const svgIds = [...node.svg.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
      children = node.svg;
      for(const original of svgIds) children = children.replaceAll(`id="${original}"`,`id="${uid}-${original}"`).replaceAll(`#${original}`,`#${uid}-${original}`);
    } else if(node.icon) {
      className += ' design-icon'; style.color = node.color;
      children = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[node.icon] || icons.ArrowUpRight}</svg>`;
    } else if(node.clock) children = '<time data-local-time></time>';
    else if(node.motion) {
      const m=node.motion, vertical=['top','bottom'].includes(m.direction);
      className += ` design-${m.kind}${vertical ? ' vertical' : ''}`;
      attributes += ` data-${m.kind}="${e(JSON.stringify(m))}"`;
      style['--track-gap'] = `${m.gap}px`; style.padding=`${m.padding}px`;
      if(m.fade) style.maskImage=`linear-gradient(${vertical ? 'to bottom' : 'to right'},transparent,#000 ${m.fadeWidth}%,#000 ${100-m.fadeWidth}%,transparent)`;
      if(m.kind==='ticker') children=`<div class="ticker-track"><div class="ticker-group">${await render(node.children,context)}</div></div>`;
      else children=`<div class="slideshow-track">${await render(node.children,context)}</div><div class="slide-arrows"><button type="button" data-slide-prev aria-label="Previous slide">‹</button><button type="button" data-slide-next aria-label="Next slide">›</button></div><div class="slide-dots">${(node.children||[]).map((_,i)=>`<button type="button" data-slide-to="${i}" aria-label="Go to slide ${i+1}" aria-current="${i===0}"></button>`).join('')}</div>`;
    } else if(id==='home' && node.children?.length && node.children.every(n => n.link?.webPageId && originalProjects.some(p=>p.id===routeIds[n.link.webPageId]))) {
      const cards=[];
      for(const project of projects){
        const row=node.children.find(n=>routeIds[n.link.webPageId]===project.id)||node.children[0];
        const original=originalProjects.find(p=>p.id===routeIds[row.link.webPageId]);
        const replacements=Object.fromEntries(['name','summary','status','cover'].map(key=>[original[key],project[key]]));
        original.tags.forEach((tag,i)=>{replacements[tag]=project.tags?.[i]||'';});
        cards.push(await render({...row,cardDestination:url(project.path)}, {...context,replacements}));
      }
      children=cards.join('');
    } else children = await render(node.children, context);
    if(node.aliases) children=node.aliases.map((alias,i)=>`<span id="${uid}-anchor-${i}" data-anchor="${e(alias)}" class="section-anchor" aria-hidden="true"></span>`).join('')+children;
    attributes += ` class="${e(className.trim())}"`;
    if(Object.keys(style).length) attributes += ` style="${e(styles(style))}"`;
    if(['br','hr','input'].includes(tag))return `<${tag}${attributes}>`;
    return `<${tag}${attributes}>${children}</${tag}>`;
  }
  const views=[];
  // Newly added navigation links share the original menu styling and work in
  // both the desktop bar and the expanded mobile menu.
  const extraNavigation=site.navigation.filter(item=>!['/#works',pages.find(p=>p.id==='about')?.path].includes(item.href));
  for(const profile of ['desktop','tablet','phone']) {
    const view = manifest[profile], sections=[];
    for(const [i,file] of view.sections.entries()) sections.push(await render(await json(`src/design/pages/${id}/${file}`),{profile,section:i}));
    let menu='';
    if(profile!=='desktop') menu=`<div class="design-menu-overlay" hidden>${await render(menus[profile],{profile,section:0})}</div>`;
    let markup=sections.join('\n')+menu;
    if(extraNavigation.length){
      const extra=extraNavigation.map(item=>`<a class="extra-navigation-link" href="${e(url(item.href))}">${e(item.label)}</a>`).join('');
      markup=markup.replace(/(<div[^>]*class="navigation__menus(?:-c651)?"[^>]*>)/g,`$1${extra}`);
    }
    views.push(`<div class="design-view" data-view="${profile}"><div class="${e(view.class)}" style="width:100%">${markup}</div></div>`);
  }
  const page=allPages.find(p=>p.id===id);
  return `<h1 class="visually-hidden">${e(page?.title || page?.name || site.title)}</h1>${views.join('\n')}<style>${[...rules].join('\n')}</style>`;
}
