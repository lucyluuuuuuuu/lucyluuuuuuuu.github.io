import { escapeHtml as e } from '../lib/html.mjs';
import { contactLinks } from '../components/footer.mjs';
import { projectCard } from '../components/project-card.mjs';

export function homePage(home, projects, site, url) {
  return `<section class="home-hero" id="hero">
    <div class="hero-heading"><div class="portrait-orbit"><img src="${e(url(home.portrait))}" alt="Animated portrait of Lucy Lu" width="150" height="130"></div><h1>Hi, I'm<br><span>Lucy Lu!</span></h1></div>
    <div class="hero-body"><div class="hero-role"><p>${e(home.role)} <span aria-hidden="true">|</span></p><div class="role-rotator" aria-label="${e(home.roles.join(', '))}">${home.roles.map((role, i) => `<span aria-hidden="true" class="${i === 0 ? 'is-active' : ''}">${e(role)}</span>`).join('')}</div></div>
    <p class="hero-description">${e(home.intro)}</p><div class="hero-actions"><a class="button" href="${e(site.resume)}" target="_blank" rel="noopener noreferrer">See my resume ↗</a>${contactLinks(site)}</div></div>
  </section>
  <section class="work-section" id="works"><div class="works-heading"><h2>Selected works</h2><span aria-hidden="true">↓</span></div><div class="project-list">${projects.map((p, i) => projectCard(p, i, url)).join('')}</div></section>`;
}
