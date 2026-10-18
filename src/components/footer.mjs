import { escapeHtml as e } from '../lib/html.mjs';

export function contactLinks(site) {
  return `<div class="social-links"><a href="mailto:${e(site.email)}" aria-label="Email Lucy Lu">Email ↗</a><a href="${e(site.instagram)}" target="_blank" rel="noopener noreferrer">Instagram ↗</a></div>`;
}

export function footer(site, url) {
  return `<footer class="site-footer" id="cta2">
    <div class="footer-intro"><p>${e(site.footer.title)}</p><h2>${e(site.footer.subtitle)}</h2>
      <a class="email-link" href="mailto:${e(site.email)}">${e(site.email)} <span aria-hidden="true">↗</span></a>
    </div>
    <div class="footer-bottom"><small>${e(site.footer.credit)}</small>${contactLinks(site)}<a href="#top">Back to top ↑</a></div>
  </footer>`;
}
