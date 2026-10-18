import { escapeHtml as e } from '../lib/html.mjs';
import { renderBlock, renderBlocks, contentSection } from '../components/content.mjs';
import { contactLinks } from '../components/footer.mjs';

export function aboutPage(sections, site, url) {
  const portrait = sections[0].blocks.find(b => b.type === 'image');
  const intro = sections[1];
  return `<div class="about-page"><section class="about-hero" id="hero"><div class="about-portrait">${renderBlock(portrait, url, { eager: true })}</div><div class="about-intro"><p class="eyebrow">A little about me</p><h1>${e(intro.heading)}</h1>${renderBlocks(intro.blocks, url)}<div class="hero-actions"><a class="button" href="${e(site.resume)}" target="_blank" rel="noopener noreferrer">See my resume ↗</a>${contactLinks(site)}</div></div></section>
  <div class="about-stories">${sections.slice(2).map((section, i) => contentSection(section, url, i + 1)).join('')}</div></div>`;
}
