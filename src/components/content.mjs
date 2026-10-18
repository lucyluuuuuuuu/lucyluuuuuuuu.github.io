import { escapeHtml as e } from '../lib/html.mjs';

export function renderBlock(block, url, { eager = false } = {}) {
  switch (block.type) {
    case 'richText':
      // These HTML fragments are editorial source files, never visitor input.
      return `<div class="rich-text">${block.html.replace(/href="\/(?!\/)/g, `href="${url('/')}`)}</div>`;
    case 'metric':
      return `<div class="metric">${block.html}</div>`;
    case 'image': {
      const dimensions = block.width && block.height ? ` width="${Math.round(block.width)}" height="${Math.round(block.height)}"` : '';
      return `<figure class="case-figure"><a class="image-zoom" href="${e(url(block.src))}" aria-label="Open image: ${e(block.alt)}"><img src="${e(url(block.src))}" alt="${e(block.alt)}"${dimensions} loading="${eager ? 'eager' : 'lazy'}" decoding="async"></a>${block.caption ? `<figcaption>${e(block.caption)}</figcaption>` : ''}</figure>`;
    }
    case 'gallery':
      return `<div class="gallery" data-gallery><div class="gallery-track" tabindex="0" role="region" aria-label="Image gallery">${block.items.map(item => renderBlock(item, url)).join('')}</div><div class="gallery-controls"><button type="button" data-gallery-prev aria-label="Previous image">←</button><span>Scroll to explore</span><button type="button" data-gallery-next aria-label="Next image">→</button></div></div>`;
    default:
      throw new Error(`Unknown content block: ${block.type}`);
  }
}

export function renderBlocks(blocks, url) {
  const output = [];
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].type === 'metric') {
      const metrics = [blocks[i]];
      while (blocks[i + 1]?.type === 'metric') metrics.push(blocks[++i]);
      output.push(`<div class="metric-row">${metrics.map(b => renderBlock(b, url)).join('')}</div>`);
    } else output.push(renderBlock(blocks[i], url));
  }
  return output.join('\n');
}

export function contentSection(section, url, index) {
  return `<section id="${e(section.id)}" class="case-section">
    <div class="section-heading"><span class="section-number">${String(index).padStart(2, '0')}</span><div>${section.eyebrow ? `<p class="eyebrow">${e(section.eyebrow)}</p>` : ''}${section.heading ? `<h2>${e(section.heading)}</h2>` : ''}</div></div>
    <div class="section-content">${renderBlocks(section.blocks, url)}</div>
  </section>`;
}
