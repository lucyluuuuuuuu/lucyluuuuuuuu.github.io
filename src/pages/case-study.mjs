import { escapeHtml as e } from '../lib/html.mjs';

// Editorial sections: copy, figures and order live in src/content/<project>/.
// No page-specific copy or paths belong in this renderer.
export function caseStudySection(section, {url, projects, id, profile}) {
  const s=section;
  const text=lines=>(lines||[]).map(p=>`<p>${e(p)}</p>`).join('');
  const figure=(f, eager=false)=>`<figure class="case-figure ${e(f.class||'')}"><a href="${e(url(f.src))}" target="_blank" rel="noopener noreferrer" aria-label="${e('Open full image: '+f.alt)}"><img src="${e(url(f.src))}" alt="${e(f.alt)}" width="${f.width}" height="${f.height}" loading="${eager?'eager':'lazy'}" decoding="async"></a>${f.caption?`<figcaption>${e(f.caption)}</figcaption>`:''}</figure>`;
  const cards=(items, cls='case-columns')=>`<div class="${cls}">${items.map((c,i)=>`<div class="case-point"><span class="case-point-number">${e(c.label||String(i+1).padStart(2,'0'))}</span><h3>${e(c.title)}</h3>${text(c.body)}</div>`).join('')}</div>`;
  function block(b) {
    if(b.type==='figure')return figure(b);
    if(b.type==='text')return `<div class="case-prose">${text(b.body)}</div>`;
    if(b.type==='callout')return `<aside class="case-callout"><p class="case-kicker">${e(b.label)}</p><p>${e(b.text)}</p>${b.note?`<small>${e(b.note)}</small>`:''}</aside>`;
    if(b.type==='points')return cards(b.items);
    if(b.type==='split')return `<div class="case-split"><div><p class="case-kicker">${e(b.label||'')}</p><h3 class="case-subtitle">${e(b.title)}</h3><div class="case-prose">${text(b.body)}</div></div>${figure(b.figure)}</div>`;
    if(b.type==='comparison')return `<div class="case-comparison">${b.items.map(c=>`<div><p class="case-kicker">${e(c.label)}</p>${figure(c.figure)}<h3>${e(c.title)}</h3><div class="case-prose">${text(c.body)}</div></div>`).join('')}</div>`;
    if(b.type==='layers')return `<div class="case-layers">${b.items.map((c,i)=>`<div><span class="case-point-number">${e(c.label)}</span><h3>${e(c.title)}</h3><p>${e(c.text)}</p><div class="case-chips">${c.tags.map(t=>`<span>${e(t)}</span>`).join('')}</div></div>`).join('')}</div>`;
    if(b.type==='sequence')return `<figure class="case-sequence"><p class="case-kicker">${e(b.label)}</p><div class="case-performance"><span>${e(b.performance)}</span><span aria-hidden="true">──────────────→</span></div><div class="case-camera-rows">${b.cameras.map((c,i)=>`<div><span>${e(c)}</span><i class="track track-${i}" aria-hidden="true"></i></div>`).join('')}</div><div class="case-cut">${b.shots.map((c,i)=>`<div class="cut-${i}"><span>${e(c.label)}</span><strong>${e(c.camera)}</strong><small>${e(c.time)}</small></div>`).join('')}</div><figcaption>${e(b.caption)}</figcaption></figure>`;
    if(b.type==='steps')return `<ol class="case-steps">${b.items.map(c=>`<li><h3>${e(c.title)}</h3><p>${e(c.text)}</p></li>`).join('')}</ol>`;
    if(b.type==='responsibilities')return `<div class="case-responsibilities">${b.items.map(c=>`<div><p class="case-kicker">${e(c.label)}</p><h3>${e(c.title)}</h3><p>${e(c.text)}</p></div>`).join('')}</div>`;
    throw new Error(`Unknown case-study block: ${b.type}`);
  }
  let body='';
  if(s.type==='hero') {
    body=`<p class="case-kicker">${e(s.eyebrow)}</p><h2 class="case-title">${e(s.title)}<em>${e(s.emphasis)}</em></h2><p class="case-lede">${e(s.description)}</p><div class="case-meta">${s.meta.map(m=>`<div><p>${e(m.label)}</p><strong>${e(m.value)}</strong></div>`).join('')}</div><div class="case-hero-art">${figure(s.figure,true)}<div class="case-hero-inset">${figure(s.inset,true)}<span>${e(s.insetLabel)}</span></div><p class="case-art-label">${e(s.artLabel)}</p></div><nav class="case-jump" aria-label="Case study chapters">${s.chapters.map(c=>`<a href="#${e(c.id)}">${e(c.label)}<span aria-hidden="true">↘</span></a>`).join('')}</nav>`;
  } else if(s.type==='related') {
    const index=projects.findIndex(p=>p.id===id);
    const next=projects[(index+1)%projects.length];
    body=`<div class="case-related"><a href="${e(url('/#works'))}">← All projects</a>${next&&next.id!==id?`<a class="case-next" href="${e(url(next.path))}"><span>Next project ↗</span><h2>${e(next.name)}</h2><p>${e(next.summary)}</p><img src="${e(url(next.cover))}" loading="lazy" alt="${e(next.name+' project cover')}"></a>`:''}</div>`;
  } else {
    body=`<header class="case-section-head"><p class="case-kicker">${e(s.eyebrow)}</p><h2>${e(s.title)}</h2>${s.intro?`<div class="case-prose">${text(s.intro)}</div>`:''}</header>${(s.blocks||[]).map(block).join('')}`;
  }
  const layout=s.type==='related'?'related-section':(s.type||'chapter');
  return `<section class="case-study case-${e(s.tone||'light')} case-${e(layout)}" id="${e(profile+'-'+s.id)}" data-anchor="${e(s.id)}"><div class="case-wrap">${body}</div></section>`;
}
