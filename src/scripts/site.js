const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-navigation');
function closeMenu() { navigation?.classList.remove('is-open'); menuButton?.setAttribute('aria-expanded', 'false'); }
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const roles = [...document.querySelectorAll('.role-rotator > span')];
let roleIndex = 0;
if (roles.length > 1) setInterval(() => {
  if (document.hidden || reducedMotion.matches) return;
  roles[roleIndex].classList.remove('is-active');
  roleIndex = (roleIndex + 1) % roles.length;
  roles[roleIndex].classList.add('is-active');
}, 2600);

document.querySelectorAll('[data-gallery]').forEach(gallery => {
  const track = gallery.querySelector('.gallery-track');
  const move = direction => track.scrollBy({ left: direction * track.clientWidth * .92, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  gallery.querySelector('[data-gallery-prev]')?.addEventListener('click', () => move(-1));
  gallery.querySelector('[data-gallery-next]')?.addEventListener('click', () => move(1));
});

const viewer = document.querySelector('.image-dialog');
let previousFocus;
if (viewer && typeof viewer.showModal === 'function') {
  document.querySelectorAll('.image-zoom').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); previousFocus = link;
    const image = viewer.querySelector('img');
    image.src = link.href; image.alt = link.querySelector('img')?.alt || '';
    viewer.showModal(); document.body.style.overflow = 'hidden';
  }));
  viewer.querySelector('.dialog-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => { document.body.style.overflow = ''; viewer.querySelector('img').removeAttribute('src'); previousFocus?.focus(); });
}
