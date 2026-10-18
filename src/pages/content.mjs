import { escapeHtml as e } from '../lib/html.mjs';
import { contentSection } from '../components/content.mjs';

// General pages such as writing, talks, contact or a design journal.
export function contentPage(page, sections, url) {
  return `<div class="project-page"><header class="project-hero"><h1>${e(page.heading || page.title)}</h1>${page.description ? `<p class="hero-description">${e(page.description)}</p>` : ''}</header><div class="case-study">${sections.map((s, i) => contentSection(s, url, i + 1)).join('')}</div></div>`;
}
