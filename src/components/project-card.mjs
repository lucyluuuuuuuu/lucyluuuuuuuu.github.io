import { escapeHtml as e } from '../lib/html.mjs';

export function projectCard(project, index, url) {
  return `<a class="project-card" href="${e(url(project.path))}" style="--project-accent:${e(project.accent)}">
    <div class="card-image"><img src="${e(url(project.cover))}" alt="${e(project.name)} project preview" loading="lazy" decoding="async"></div>
    <div class="card-copy"><div class="card-eyebrow"><span>${String(index + 1).padStart(2, '0')} / ${e(project.name)}</span><span aria-hidden="true">↗</span></div>
    <h3>${e(project.summary)}</h3><p class="project-status">${e(project.status)}</p>
    <ul class="tags">${project.tags.map(tag => `<li>${e(tag)}</li>`).join('')}</ul></div>
  </a>`;
}
