// Shared Framer component transitions. Keep layout projection separate from
// property animation: the source uses a 0..1000 spring for layout and 0..100
// for complex values (including colors), not one fixed CSS transition duration.
export const hoverSpring = Object.freeze({ stiffness: 500, damping: 60, mass: 1 });

export function hoverProgress(milliseconds, range = 1000) {
  const { stiffness, damping, mass } = hoverSpring;
  const root = Math.sqrt(damping * damping - 4 * mass * stiffness);
  const a = (-damping + root) / (2 * mass);
  const b = (-damping - root) / (2 * mass);
  const t = Math.max(0, milliseconds) / 1000;
  const value = 1 + (b * Math.exp(a * t) - a * Math.exp(b * t)) / (a - b);
  // This published Framer runtime settles overdamped springs by displacement.
  // A new layout projection starts from the current visual box with velocity 0.
  return (1 - value) * range <= .5 ? 1 : value;
}

const color = value => {
  const numbers = value.match(/[\d.]+/g)?.map(Number);
  return /^rgba?\(/.test(value) && numbers?.length >= 3
    ? [...numbers.slice(0, 3), numbers[3] ?? 1] : null;
};

export function mixHoverColor(from, to, progress) {
  const a = color(from), b = color(to);
  if (!a || !b) return to;
  // Match the source's squared RGB channels; CSS color interpolation and
  // premultiplied transparent colors follow a visibly different path.
  const rgb = a.slice(0, 3).map((v, i) =>
    Math.round(Math.sqrt(Math.max(0, v * v + (b[i] * b[i] - v * v) * progress))));
  return `rgba(${rgb.join(', ')}, ${a[3] + (b[3] - a[3]) * progress})`;
}

const corners = ['border-top-left-radius', 'border-top-right-radius',
  'border-bottom-left-radius', 'border-bottom-right-radius'];
const box = el => {
  const r = el.getBoundingClientRect();
  return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
};
const mixBox = (a, b, p) => Object.fromEntries(
  Object.keys(a).map(key => [key, a[key] + (b[key] - a[key]) * p]));
const differs = (a, b) => Object.keys(a).some(key => Math.abs(a[key] - b[key]) > .01);

export function installHover(reduced) {
  const controllers = [];
  const roots = document.querySelectorAll(
    '[data-component=logo],[data-component=work-card],[data-component=related-card],[data-component=button],[data-component=social]');

  for (const root of roots) {
    const layoutNodes = [root, ...root.querySelectorAll('[data-layout]')];
    const propertyNodes = [root, ...root.querySelectorAll('[data-hover-properties]')]
      .filter(el => el.dataset.hoverProperties && el.closest('[data-component]') === root);
    const images = [...root.querySelectorAll('img[data-hover-sizes]')]
      .map(el => ({ el, sizes: el.sizes }));
    let frameId, changes = [], hovered = false, focused = false, pressed = false;
    root.dataset.hoverState = 'idle';
    root.dataset.pressState = 'idle';

    // Only restore properties owned by this controller. Nested buttons can
    // animate their colors while their parent card projects their position.
    function clear() {
      cancelAnimationFrame(frameId);
      for (const { el, key, value, priority } of changes) {
        if (value) el.style.setProperty(key, value, priority);
        else el.style.removeProperty(key);
      }
      changes = [];
    }
    function own(el, key) {
      changes.push({ el, key, value: el.style.getPropertyValue(key),
        priority: el.style.getPropertyPriority(key) });
    }
    function set(el, key, value) { el.style.setProperty(key, value, 'important'); }
    function readProperties() {
      return propertyNodes.flatMap(el => {
        const style = getComputedStyle(el);
        return JSON.parse(el.dataset.hoverProperties).map(key =>
          ({ el, key, value: style.getPropertyValue(key).trim() }));
      });
    }
    function update() {
      const next = hovered || focused ? 'hover' : 'idle';
      const down = pressed ? 'pressed' : 'idle';
      if (root.dataset.hoverState === next && root.dataset.pressState === down) return;
      const before = new Map(layoutNodes.map(el => [el, box(el)]));
      const propertiesBefore = readProperties();
      clear();
      root.dataset.hoverState = next;
      root.dataset.pressState = down;
      for (const { el, sizes } of images) el.sizes = next === 'hover' ? el.dataset.hoverSizes : sizes;
      if (reduced.matches || !root.getClientRects().length) return;

      const targets = new Map(layoutNodes.map(el => [el, box(el)]));
      const layoutChanged = layoutNodes.some(el => differs(before.get(el), targets.get(el)));
      const records = [];
      if (layoutChanged) {
        const included = new Map();
        for (const el of layoutNodes) {
          const target = targets.get(el);
          if (!target.width || !target.height) continue;
          const style = getComputedStyle(el);
          let parent = el.parentElement;
          while (parent && !included.has(parent)) parent = parent.parentElement;
          const record = { el, from: before.get(el), to: target,
            base: style.transform === 'none' ? '' : style.transform,
            radii: corners.map(key => style.getPropertyValue(key)),
            parent: included.get(parent) };
          records.push(record); included.set(el, record);
          own(el, 'transform'); own(el, 'transform-origin');
          for (const key of corners) own(el, key);
        }
      }
      const propertiesAfter = readProperties();
      const properties = propertiesBefore.flatMap((from, i) => {
        const to = propertiesAfter[i].value;
        if (from.value === to || !color(from.value) || !color(to)) return [];
        own(from.el, from.key);
        return [{ ...from, to }];
      });
      if (!records.length && !properties.length) return;
      const start = performance.now();
      function draw(now) {
        const layoutProgress = hoverProgress(now - start);
        const styleProgress = hoverProgress(now - start, 100);
        for (const record of records) {
          const { el, from, to, parent, base, radii } = record;
          const current = record.current = mixBox(from, to, layoutProgress);
          const px = parent ? parent.current.width / parent.to.width : 1;
          const py = parent ? parent.current.height / parent.to.height : 1;
          const originX = parent ? parent.current.x + (to.x - parent.to.x) * px : to.x;
          const originY = parent ? parent.current.y + (to.y - parent.to.y) * py : to.y;
          const sx = current.width / to.width, sy = current.height / to.height;
          set(el, 'transform-origin', '0 0');
          set(el, 'transform', `${base} translate3d(${(current.x - originX) / px}px,${(current.y - originY) / py}px,0) scale(${sx / px},${sy / py})`);
          // Cancel inherited scale on each layout child (especially text) and
          // keep the corner radius constant while a card's image expands.
          radii.forEach((radius, i) => {
            if (/^[\d.]+px$/.test(radius))
              set(el, corners[i], `${parseFloat(radius) / sx}px ${parseFloat(radius) / sy}px`);
          });
        }
        for (const { el, key, value, to } of properties)
          set(el, key, mixHoverColor(value, to, styleProgress));
        if ((!records.length || layoutProgress === 1) && (!properties.length || styleProgress === 1)) clear();
        else frameId = requestAnimationFrame(draw);
      }
      draw(start);
    }
    root.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      hovered = true; update();
    });
    root.addEventListener('pointerleave', () => { hovered = false; pressed = false; update(); });
    if (root.classList.contains('work-card__variant-variant-5')) {
      root.addEventListener('pointerdown', () => { pressed = true; update(); });
      root.addEventListener('pointerup', () => { pressed = false; update(); });
    }
    root.addEventListener('pointercancel', () => { hovered = false; pressed = false; update(); });
    root.addEventListener('focusin', event => {
      focused = event.target.matches(':focus-visible'); update();
    });
    root.addEventListener('focusout', event => {
      if (!root.contains(event.relatedTarget)) { focused = false; update(); }
    });
    // Home cards are wrapped in the project link, so keyboard focus lands on
    // that wrapper rather than the component's inner span.
    const link = root.closest('.project-entry');
    if (link) {
      link.addEventListener('focus', () => { focused = link.matches(':focus-visible'); update(); });
      link.addEventListener('blur', () => { focused = false; update(); });
    }
    controllers.push(() => {
      clear();
      if (!root.getClientRects().length) {
        hovered = focused = pressed = false;
        root.dataset.hoverState = root.dataset.pressState = 'idle';
        for (const { el, sizes } of images) el.sizes = sizes;
      }
    });
  }
  addEventListener('resize', () => controllers.forEach(stop => stop()));
  reduced.addEventListener('change', () => controllers.forEach(stop => stop()));
}
