import { escapeHtml as e, plainText } from '../lib/html.mjs';
import { renderBlock, renderBlocks, contentSection } from '../components/content.mjs';

function projectFacts(blocks, url) {
  const labels = new Set(['Team', 'Tools', 'Duration', 'Status', 'My Responsibility']);
  const groups = []; let current;
  for (const block of blocks) {
    const text = plainText(block.html);
    if (labels.has(text)) { current = { title: text, blocks: [] }; groups.push(current); }
    else { if (!current) { current = { title: '', blocks: [] }; groups.push(current); } current.blocks.push(block); }
  }
  return `<dl class="project-facts">${groups.map(g => `<div class="${g.title === 'My Responsibility' ? 'responsibility' : ''}"><dt>${e(g.title)}</dt><dd>${renderBlocks(g.blocks, url)}</dd></div>`).join('')}</dl>`;
}

export function projectPage(project, sections, projects, url) {
  const intro = sections[0];
  const coverIndex = intro.blocks.findIndex(b => b.type === 'image');
  const tags = [...new Set(intro.blocks.slice(0, coverIndex).map(b => plainText(b.html)))];
  const articleSections = sections.slice(1);
  const position = projects.findIndex(p => p.id === project.id);
  const previous = projects[(position - 1 + projects.length) % projects.length];
  const next = projects[(position + 1) % projects.length];
  return `<article class="project-page" style="--project-accent:${e(project.accent)}">
  <header class="project-hero"><a class="back-link" href="${url('/#works')}">← All projects</a><p class="eyebrow">${e(project.name)}</p><h1>${e(intro.heading)}</h1><ul class="tags">${tags.map(t => `<li>${e(t)}</li>`).join('')}</ul></header>
  <div class="project-cover">${renderBlock(intro.blocks[coverIndex], url, { eager: true })}</div>
  <div class="project-overview">${projectFacts(intro.blocks.slice(coverIndex + 1), url)}</div>
  <details class="project-contents"><summary>On this page <span aria-hidden="true">↓</span></summary><nav aria-label="Case study contents">${articleSections.map((s, i) => `<a href="#${e(s.id)}">${String(i + 1).padStart(2, '0')} ${e(s.eyebrow || s.heading)}</a>`).join('')}</nav></details>
  <div class="case-study">${articleSections.map((s, i) => contentSection(s, url, i + 1)).join('')}</div>
  ${projects.length > 1 ? `<nav class="project-pagination" aria-label="More projects"><a href="${e(url(previous.path))}"><span>← Previous project</span><strong>${e(previous.name)}</strong></a><a href="${e(url(next.path))}"><span>Next project →</span><strong>${e(next.name)}</strong></a></nav>` : ''}
  </article><a class="back-to-top" href="#top" aria-label="Back to top">↑</a>`;
}
