export const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export const plainText = (html = '') => html.replace(/<[^>]*>/g, '')
  .replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"').replaceAll('&#39;', "'").trim();

export function makeUrl(basePath = '') {
  const prefix = basePath === '/' ? '' : basePath.replace(/\/$/, '');
  return (path) => path.startsWith('/') ? `${prefix}${path}` : path;
}
