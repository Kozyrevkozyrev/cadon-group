document.getElementById('year').textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

// Contact form

const form = document.getElementById('contact-form');
const email = document.getElementById('email');
const error = document.getElementById('email-error');
const status = document.getElementById('form-status');

form.addEventListener('submit', event => {
  event.preventDefault();
  status.hidden = true;
  const valid = email.validity.valid && email.value.trim().length > 0;
  error.hidden = valid;
  email.setAttribute('aria-invalid', String(!valid));
  if (!valid) {
    email.focus();
    email.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: reduceMotion.matches ? 0 : 420, easing: 'ease-out' });
    return;
  }
  status.textContent = 'This preview does not send enquiries. Contact requests will be enabled when the final website launches.';
  status.hidden = false;
});
email.addEventListener('input', () => {
  error.hidden = true;
  email.removeAttribute('aria-invalid');
  status.hidden = true;
});

// Dialogs

document.querySelectorAll('[data-dialog]').forEach(trigger => {
  trigger.addEventListener('click', () => {
    document.getElementById(trigger.dataset.dialog).showModal();
  });
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelectorAll('.dialog-close, .dialog-dismiss').forEach(button => {
    button.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});

// Scroll reveal: each .reveal gets .is-in once it enters; children of .stagger cascade

document.querySelectorAll('.stagger').forEach(group => {
  group.querySelectorAll(':scope > .reveal').forEach((item, i) => item.style.setProperty('--i', i));
});

const counters = new WeakSet();
function countUp(el) {
  if (counters.has(el)) return;
  counters.add(el);
  const to = Number(el.dataset.count);
  const from = Number(el.dataset.from || 0);
  const pad = Number(el.dataset.pad || 0);
  const show = n => { el.textContent = String(Math.round(n)).padStart(pad, '0'); };
  const start = performance.now();
  const duration = 1800;
  show(from);
  requestAnimationFrame(function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    show(from + (to - from) * (1 - Math.pow(1 - t, 4)));
    if (t < 1) requestAnimationFrame(tick);
  });
}

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
    entry.target.querySelectorAll('[data-count]').forEach(countUp);
    revealObserver.unobserve(entry.target);
  });
}, { rootMargin: '0px 0px -12% 0px', threshold: .12 });
document.querySelectorAll('.reveal, .footer-wordmark').forEach(el => revealObserver.observe(el));

// Header and progress bar

const header = document.querySelector('.header');
const progress = document.querySelector('.progress');
let lastY = window.scrollY;

function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
  header.classList.toggle('is-scrolled', y > 24);
  header.classList.toggle('is-hidden', y > lastY && y > 320 && !header.contains(document.activeElement));
  lastY = y;
  updateChain();
}

// Value chain: steps light up one by one as the pinned section scrolls

const approach = document.querySelector('.approach');
const chain = document.querySelector('.value-chain');
const steps = [...chain.children];
chain.classList.add('is-staged');

function updateChain() {
  const pinned = getComputedStyle(document.querySelector('.approach-pin')).position === 'sticky';
  let p;
  if (pinned) {
    const rect = approach.getBoundingClientRect();
    p = -rect.top / (rect.height - window.innerHeight);
  } else {
    const rect = chain.getBoundingClientRect();
    p = (window.innerHeight * .8 - rect.top) / rect.height;
  }
  p = Math.min(1, Math.max(0, p));
  chain.style.setProperty('--progress', p.toFixed(4));
  steps.forEach((step, i) => step.classList.toggle('is-active', p > i / steps.length + .04 || p === 1));
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

// Company rows: smooth open and close

document.querySelectorAll('.company').forEach(details => {
  const summary = details.querySelector('summary');
  const body = details.querySelector('.company-detail');
  let animation = null;
  summary.addEventListener('click', event => {
    if (reduceMotion.matches) return;
    event.preventDefault();
    animation?.cancel();
    if (details.open) {
      animation = body.animate([{ height: `${body.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
      animation.onfinish = () => { details.open = false; animation = null; };
    } else {
      details.open = true;
      animation = body.animate([{ height: '0px', opacity: 0 }, { height: `${body.scrollHeight}px`, opacity: 1 }], { duration: 620, easing: 'cubic-bezier(.16,1,.3,1)' });
      animation.onfinish = () => { animation = null; };
    }
  });
});

// Magnetic buttons

if (finePointer.matches) {
  document.querySelectorAll('.magnetic').forEach(button => {
    button.addEventListener('pointermove', event => {
      if (reduceMotion.matches) return;
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * .18;
      const y = (event.clientY - rect.top - rect.height / 2) * .3;
      button.style.transform = `translate(${x}px, ${y}px)`;
    });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });
}

// Group map: dot-matrix map of Europe with Canada in an inset; lines run from the group's base in England to each company.
// A tag flies to the company in focus, and when nobody is interacting the map tours the companies on its own.

(function groupMap() {
  const data = window.CADON_MAP;
  const figure = document.querySelector('.group-map');
  const canvas = figure?.querySelector('canvas');
  if (!data || !canvas) return;
  const ctx = canvas.getContext('2d');
  const caption = figure.querySelector('.map-caption');
  const captionName = caption.querySelector('.map-caption-head strong');
  const captionPlace = caption.querySelector('.map-caption-head span');
  const captionText = caption.querySelector('p');
  const tourBar = caption.querySelector('.map-progress');
  const tag = figure.querySelector('.map-tag');
  const tagName = tag.querySelector('strong');
  const tagPlace = tag.querySelector('span');
  const home = { name: captionName.textContent, place: captionPlace.textContent, text: captionText.textContent };
  const inset = data.inset;
  const tags = data.tags;
  const groupTags = new Set(['gb', 'gr', 'nl', 'bg', 'ca', 'ch', 'de']);
  const routes = ['nl', 'de', 'ch', 'bg', 'gr', 'ca'];
  const TOUR_STEP = 4200;

  const dots = data.dots.split(';').map(item => {
    const [x, y, t] = item.split(',').map(Number);
    return { x, y, tag: tags[t], delay: Math.hypot(x - data.places.hq[0], y - data.places.hq[1]) / 1000 };
  });

  const glow = {};
  tags.forEach(t => { glow[t] = 0; });
  let active = null;
  let activeRow = null;
  let pinned = null;
  let hovering = false;
  let started = null;
  let visible = false;
  let frame = 0;
  let scale = 1;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    scale = width / data.w;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(width * data.h / data.w * dpr);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    placeTag();
    draw(performance.now());
  }

  const mix = (a, b, t) => Math.round(a + (b - a) * t);
  function dotColor(dot, light) {
    // base land colour, deeper for countries in the group, brand blue → sky when lit
    const base = groupTags.has(dot.tag) ? [168, 186, 222] : [214, 221, 234];
    if (light <= 0) return `rgb(${base})`;
    const k = dot.x / data.w;
    const lit = [mix(60, 111, k), mix(102, 187, k), 255];
    return `rgb(${mix(base[0], lit[0], light)},${mix(base[1], lit[1], light)},${mix(base[2], lit[2], light)})`;
  }

  function curve(to) {
    const [x1, y1] = data.places.hq;
    const [x2, y2] = to;
    const lift = Math.min(160, Math.hypot(x2 - x1, y2 - y1) * .32);
    return [x1, y1, (x1 + x2) / 2, Math.min(y1, y2) - lift, x2, y2];
  }
  function pointOn(c, t) {
    const u = 1 - t;
    return [u * u * c[0] + 2 * u * t * c[2] + t * t * c[4], u * u * c[1] + 2 * u * t * c[3] + t * t * c[5]];
  }
  function strokePart(c, t) {
    ctx.beginPath();
    ctx.moveTo(c[0], c[1]);
    for (let s = 1; s <= 48; s++) {
      const [x, y] = pointOn(c, (s / 48) * t);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  function node(x, y, size, color) {
    ctx.fillStyle = '#f3f6fc';
    ctx.fillRect(x - size / 2 - 3, y - size / 2 - 3, size + 6, size + 6);
    ctx.fillStyle = color;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  }

  // "Europe" (location to be confirmed) lights the whole continent, the group's own European countries a little less
  function targetGlow(t) {
    if (active === null) return 0;
    if (t === active) return 1;
    if (active === 'eu' && groupTags.has(t) && t !== 'ca') return .6;
    return 0;
  }

  function draw(now) {
    const still = reduceMotion.matches;
    if (started === null) { frame = 0; return; }
    const intro = (now - started) / 1000;
    ctx.clearRect(0, 0, data.w, data.h);

    let settling = false;
    tags.forEach(t => {
      const target = targetGlow(t);
      const next = glow[t] + (target - glow[t]) * .1;
      const done = Math.abs(next - target) < .004;
      if (!done) settling = true;
      glow[t] = done ? target : next;
    });

    // Canada inset
    const insetIn = Math.min(1, Math.max(0, (intro - .9) / .6));
    if (insetIn > 0) {
      ctx.globalAlpha = insetIn;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(inset.x, inset.y, inset.w, inset.h);
      ctx.fillStyle = '#3c66ff';
      ctx.fillRect(inset.x, inset.y + inset.h - 2, inset.w * insetIn, 2);
      ctx.globalAlpha = 1;
    }

    // land, with a ripple running out from the place in focus across its lit dots
    const focus = data.places[active] || data.places.hq;
    const size = data.step * .5;
    for (const dot of dots) {
      const t = Math.min(1, Math.max(0, (intro - dot.delay) / .7));
      if (t <= 0) continue;
      let light = Math.max(glow[dot.tag] || 0, dot.tag === 'gb' ? .4 : 0);
      if (light > 0 && glow[dot.tag] > 0 && !still) {
        const d = Math.hypot(dot.x - focus[0], dot.y - focus[1]);
        light *= .72 + .28 * Math.sin(d * .09 - now * .005);
      }
      ctx.globalAlpha = t;
      ctx.fillStyle = dotColor(dot, light);
      const s = size * (.3 + .7 * t);
      ctx.fillRect(dot.x - s / 2, dot.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;

    // routes from England to each company's country
    routes.forEach((t, i) => {
      const k = Math.min(1, Math.max(0, (intro - 1.2 - i * .16) / 1.2));
      if (k <= 0) return;
      const c = curve(data.places[t]);
      const on = glow[t];
      ctx.strokeStyle = `rgba(60,102,255,${.3 + on * .7})`;
      ctx.lineWidth = (1.1 + on * 1.4) / scale;
      strokePart(c, 1 - Math.pow(1 - k, 3));
      if (k === 1) {
        if (on > .5 && !still) {
          const [px, py] = pointOn(c, (now / 1600) % 1);
          ctx.fillStyle = '#0d1426';
          ctx.fillRect(px - 2.5, py - 2.5, 5, 5);
        }
        node(...data.places[t], 8 + on * 4, on > .05 ? '#2b53e6' : '#3c66ff');
      }
    });

    // the group's base: a square that sends out a slow pulse
    if (intro > .2) {
      const [x, y] = data.places.hq;
      const pulse = still ? 0 : (now / 2400) % 1;
      ctx.strokeStyle = `rgba(60,102,255,${(1 - pulse) * .6})`;
      ctx.lineWidth = 1.2 / scale;
      const r = 7 + pulse * 30;
      ctx.strokeRect(x - r, y - r, r * 2, r * 2);
      node(x, y, 11, '#0d1426');
    }

    const live = visible && !still;
    frame = live || settling || intro < 3.6 ? requestAnimationFrame(draw) : 0;
  }

  function wake() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function placeTag() {
    const [x, y] = data.places[active] || data.places.hq;
    tag.style.transform = `translate(${(x * scale).toFixed(1)}px, ${(y * scale).toFixed(1)}px)`;
    tag.classList.toggle('is-left', x > data.w * .7);
  }

  function setActive(place, row) {
    if (place === active && row === activeRow) return;
    active = place;
    activeRow = row;
    rows.forEach(r => r.classList.toggle('is-active', r === row));
    const info = row
      ? { name: row.querySelector('.company-main strong').textContent, place: row.querySelector('.company-location').textContent, text: row.querySelector('.company-detail p').textContent }
      : home;
    captionName.textContent = tagName.textContent = info.name;
    captionPlace.textContent = tagPlace.textContent = info.place;
    captionText.textContent = info.text;
    for (const el of [caption, tag]) {
      el.classList.remove('is-changing');
      void el.offsetWidth;
      el.classList.add('is-changing');
    }
    placeTag();
    wake();
  }

  // Tour: step through the companies while the map is in view and nobody is pointing at the list
  let tourIndex = -1;
  let tourTimer = 0;
  function tourTick() {
    clearTimeout(tourTimer);
    tourBar.classList.remove('is-running');
    if (!visible || hovering || pinned) return;
    tourIndex = (tourIndex + 1) % rows.length;
    setActive(rows[tourIndex].dataset.place, rows[tourIndex]);
    tourBar.style.setProperty('--tour', `${TOUR_STEP}ms`);
    void tourBar.offsetWidth;
    tourBar.classList.add('is-running');
    tourTimer = setTimeout(tourTick, TOUR_STEP);
  }
  function resumeTour(delay) {
    clearTimeout(tourTimer);
    tourBar.classList.remove('is-running');
    if (!visible || hovering || pinned) return;
    tourTimer = setTimeout(tourTick, delay);
  }

  const rows = [...document.querySelectorAll('.company[data-place]')];
  rows.forEach(row => {
    const summary = row.querySelector('summary');
    const enter = () => {
      hovering = true;
      clearTimeout(tourTimer);
      tourBar.classList.remove('is-running');
      tourIndex = rows.indexOf(row);
      setActive(row.dataset.place, row);
    };
    const leave = () => {
      hovering = false;
      if (pinned) setActive(pinned.dataset.place, pinned);
      resumeTour(2400);
    };
    row.addEventListener('pointerenter', enter);
    row.addEventListener('pointerleave', leave);
    summary.addEventListener('focus', enter);
    summary.addEventListener('blur', leave);
    row.addEventListener('toggle', () => {
      if (row.open) pinned = row;
      else if (pinned === row) pinned = rows.find(r => r.open) || null;
      if (pinned) {
        clearTimeout(tourTimer);
        tourBar.classList.remove('is-running');
        setActive(pinned.dataset.place, pinned);
      } else {
        resumeTour(2400);
      }
    });
  });

  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible && started === null) {
      started = performance.now();
      resumeTour(3800);
    } else if (visible) {
      resumeTour(1600);
    } else {
      clearTimeout(tourTimer);
    }
    if (visible) wake();
  }, { threshold: .25 }).observe(canvas);

  new ResizeObserver(resize).observe(canvas);
  resize();
})();
