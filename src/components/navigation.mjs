import { escapeHtml as e } from '../lib/html.mjs';

export function navigation(site, currentPath, url) {
  return `<a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <a class="wordmark" href="${url('/')}" aria-label="Lucy Lu home">Lucy Lu<span aria-hidden="true">✳</span></a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation">Menu <span aria-hidden="true">☰</span></button>
    <nav id="primary-navigation" class="primary-navigation" aria-label="Main navigation">
      ${site.navigation.map(item => `<a href="${e(url(item.href))}"${item.href.split('#')[0] === currentPath ? ' aria-current="page"' : ''}>${e(item.label)}</a>`).join('')}
      <a href="${e(site.resume)}" target="_blank" rel="noopener noreferrer">Resume <span aria-hidden="true">↗</span></a>
      <a class="nav-contact" href="mailto:${e(site.email)}">Let's talk <span aria-hidden="true">↗</span></a>
    </nav>
  </header>`;
}
