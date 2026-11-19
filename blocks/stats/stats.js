/**
 * Stats block.
 * Authoring (DA): one row per stat -> [value | label | description (optional)]
 *   | Stats            |
 *   | 98% | Satisfaction | Customers who recommend us |
 * Variants: (cards), (centered), (dark). Count-up runs once on view unless the
 * user prefers reduced motion.
 */
const NUMBER_RE = /^([^\d-]*)(-?[\d.,]+)(.*)$/;

function parseValue(text) {
  const match = NUMBER_RE.exec(text.trim());
  if (!match) return null;
  const [, prefix, num, suffix] = match;
  const normalized = num.replace(/,/g, '');
  const target = parseFloat(normalized);
  if (Number.isNaN(target)) return null;
  const decimals = (normalized.split('.')[1] || '').length;
  return {
    prefix, suffix, target, decimals,
  };
}

function animate(el, {
  prefix, suffix, target, decimals,
}) {
  const duration = 1500;
  const start = performance.now();
  const fmt = new Intl.NumberFormat(document.documentElement.lang || undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    el.textContent = `${prefix}${fmt.format(target * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export default function decorate(block) {
  const list = document.createElement('ul');
  const counters = [];

  [...block.children].forEach((row) => {
    const [valueCell, labelCell, descCell] = [...row.children];
    if (!valueCell) return;

    const li = document.createElement('li');
    const value = document.createElement('p');
    value.className = 'stats-value';
    const raw = valueCell.textContent.trim();
    value.textContent = raw;
    li.append(value);

    if (labelCell && labelCell.textContent.trim()) {
      const label = document.createElement('p');
      label.className = 'stats-label';
      label.append(...labelCell.childNodes);
      li.append(label);
    }
    if (descCell && descCell.textContent.trim()) {
      const desc = document.createElement('div');
      desc.className = 'stats-description';
      desc.append(...descCell.childNodes);
      li.append(desc);
    }

    const parsed = parseValue(raw);
    if (parsed) {
      value.setAttribute('aria-label', raw);
      counters.push({ el: value, parsed });
    }
    list.append(li);
  });

  block.replaceChildren(list);

  if (!counters.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    observer.disconnect();
    counters.forEach(({ el, parsed }) => animate(el, parsed));
  }, { threshold: 0.3 });
  observer.observe(block);
}
