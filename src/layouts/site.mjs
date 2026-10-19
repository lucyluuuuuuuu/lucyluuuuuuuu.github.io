import { escapeHtml as e } from '../lib/html.mjs';
import { navigation } from '../components/navigation.mjs';
import { footer } from '../components/footer.mjs';

export function layout({ site, title, description, path, body, url, kind = 'page', image, restored = false }) {
  const canonical = `${site.url.replace(/\/$/, '')}${path}`;
  return `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${e(title)}</title><meta name="description" content="${e(description)}">
  <meta name="theme-color" content="#000000"><link rel="canonical" href="${e(canonical)}">
  <meta property="og:type" content="website"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${e(canonical)}">
  ${image ? `<meta property="og:image" content="${e(site.url.replace(/\/$/, '') + image)}">` : ''}
  <link rel="icon" href="${url('/assets/favicon.png')}"><link rel="preload" href="${url('/assets/fonts/neue-montreal-regular.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${url(restored ? '/assets/design.css' : '/assets/site.css')}"><script src="${url(restored ? '/assets/design.js' : '/assets/site.js')}" defer></script>
</head><body id="top" class="${e(kind)}">
${restored ? '<a class="skip-link" href="#main">Skip to content</a>' : navigation(site, path, url)}
<main id="main">${body}</main>
${restored ? '' : footer(site, url)}
${restored ? '' : '<dialog class="image-dialog" aria-label="Expanded project image"><button type="button" class="dialog-close" aria-label="Close expanded image">Close ×</button><img alt=""></dialog>'}
</body></html>`;
}
