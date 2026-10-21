// Ketan Duggal paintings app: home, vault, studio, viewing room, install and offline support.
const CONTACT_EMAIL = 'ketanduggal2k11@gmail.com';

const ERAS = {
  phase1: { num: '01', years: '2011–2014', title: 'Raw Roots & Heavy Oil', short: 'Raw Roots', cover: 'the-urban-hermit-2012',
    note: 'Raw emotion, deep shadows and pure introspective oil work straight from the Pilani studio.' },
  phase2: { num: '02', years: '2015–2021', title: 'Fluid Resin & Sydney Drift', short: 'Fluid Resin', cover: 'study-of-balance-2020',
    note: 'Flow-state resin, ocean blues, gilded detail and modern abstract energy.' },
  phase3: { num: '03', years: '2022–Present', title: 'Street Pop & Luxury Satire', short: 'Street Pop', cover: 'richie-carrying-gifts-and-high-fashion-brands-2024',
    note: 'Richie enters the scene. Loud, unapologetic street collage calling out luxury hype and flex culture.' }
};
// The same six works the website's 3D rotunda shows.
const ROTUNDA = [18, 1, 17, 19, 16, 20];
const VIEWS = ['home', 'vault', 'studio'];

const $ = id => document.getElementById(id);
const track = $('track'), viewer = $('viewer'), info = $('info'), grid = $('grid');
let paintings = [], era = 'all', view = 'home';
let list = [], current = -1, slidesFor = null;

init();

async function init() {
  setupTheme();
  paintings = await (await fetch('paintings.json')).json();
  $('statWorks').textContent = paintings.length;
  renderRotunda();
  renderEraRail();
  renderRecent();
  renderChips();
  renderGrid();
  setupVip();
  setupWall();
  setupAlerts();
  route(false);
  setupInstall();
  registerWorker();
  startDust();
}

// ---------- Theme (light gallery by default, like the website) ----------

function setupTheme() {
  const saved = store('theme');
  setTheme(saved || 'light');
  $('themeBtn').onclick = () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    store('theme', next);
  };
}

function setTheme(t) {
  document.documentElement.dataset.theme = t;
  $('themeBtn').textContent = t === 'dark' ? 'Light' : 'Dark';
  $('themeColor').content = t === 'dark' ? '#08080a' : '#f7f6f2';
}

// ---------- Navigation between Home, Vault and Studio ----------

document.addEventListener('click', ev => {
  const go = ev.target.closest('[data-go]');
  if (!go) return;
  ev.preventDefault();
  show(go.dataset.go);
});

function show(name, opts = {}) {
  if (!VIEWS.includes(name)) name = 'home';
  const changed = name !== view;
  view = name;
  VIEWS.forEach(v => $('view-' + v).classList.toggle('active', v === name));
  document.querySelectorAll('.tab').forEach(t => t.dataset.go === name ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current'));
  if (!opts.keepHash) history.replaceState(null, '', name === 'home' ? location.pathname : '#' + name);
  if (changed || opts.top) window.scrollTo({ top: 0 });
}

function route(push) {
  // Back from the wall view: stay in the viewing room, on the painting the wall view ended on.
  if (!$('wallview').hidden && !history.state?.wall) {
    closeWall();
    if (current >= 0) return;
  }
  const hash = location.hash.slice(1);
  if (VIEWS.includes(hash) || !hash) {
    if (current >= 0) closeViewer();
    show(hash || 'home', { keepHash: true });
    return;
  }
  const p = paintings.find(x => x.slug === hash);
  if (p) openPainting(paintings, paintings.indexOf(p), push);
}
window.addEventListener('popstate', () => route(false));

$('toDrop').onclick = () => $('drop-section').scrollIntoView({ behavior: 'smooth' });

// ---------- Home ----------

function renderRotunda() {
  const works = ROTUNDA.map(id => paintings.find(p => p.id === id)).filter(Boolean);
  $('cylinder').innerHTML = works.map((p, i) => `
    <button class="rot-card" style="--angle:${i * 360 / works.length}deg;--r:${clamp(p.images[0].h / p.images[0].w, 0.4, 1.4).toFixed(3)}" data-id="${p.id}" aria-label="${esc(p.title)}, ${p.year}">
      <img src="img/thumb/${p.images[0].file}" alt="" draggable="false">
      <span class="rot-tag"><b>${esc(p.title)}</b><span>${p.year} // ${mediumWord(p)}</span></span>
    </button>`).join('');

  const stage = $('rotunda'), cyl = $('cylinder');
  let angle = 0, velocity = 0.12, dragging = false, startX = 0, startAngle = 0, moved = 0, visible = true;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
  (function spin() {
    if (!dragging && visible && view === 'home' && current < 0 && !still) angle -= velocity;
    cyl.style.transform = `rotateX(-4deg) rotateY(${angle}deg)`;
    requestAnimationFrame(spin);
  })();

  stage.addEventListener('pointerdown', e => {
    dragging = true; moved = 0; startX = e.clientX; startAngle = angle;
  });
  addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    angle = startAngle + dx * 0.4;
  });
  addEventListener('pointerup', () => { dragging = false; });
  addEventListener('pointercancel', () => { dragging = false; });
  stage.addEventListener('click', e => {
    const card = e.target.closest('.rot-card');
    if (!card || moved > 8) return;
    const i = paintings.findIndex(p => p.id === +card.dataset.id);
    openPainting(paintings, i, true);
  });
}

function renderEraRail() {
  $('eraRail').innerHTML = Object.entries(ERAS).map(([id, e]) => {
    const cover = paintings.find(p => p.slug === e.cover);
    const count = paintings.filter(p => p.phase === id).length;
    return `
      <button class="panel era-card" data-era="${id}">
        <div class="cover"><img src="img/thumb/${cover.images[0].file}" alt="" loading="lazy"></div>
        <div class="body">
          <span class="era-label">Era ${e.num} // ${e.years}</span>
          <h3>${esc(e.title)}</h3>
          <p>${esc(e.note)}</p>
          <span class="meta count"><b>${String(count).padStart(2, '0')}</b> works →</span>
        </div>
      </button>`;
  }).join('');
  $('eraRail').onclick = ev => {
    const card = ev.target.closest('.era-card');
    if (!card) return;
    setEra(card.dataset.era);
    show('vault', { top: true });
  };
}

function renderRecent() {
  const recent = [...paintings].sort((a, b) => b.year - a.year || b.id - a.id).slice(0, 7);
  $('recentRail').innerHTML = recent.map(p => `
    <button class="art-card mini" data-id="${p.id}" aria-label="${esc(p.title)}, ${p.year}">
      <div class="frame"><div class="canvas"><img src="img/thumb/${p.images[0].file}" alt="" loading="lazy"></div></div>
      <div class="caption"><h3>${esc(p.title)}</h3><span>${p.year}</span></div>
    </button>`).join('');
  $('recentRail').onclick = ev => {
    const b = ev.target.closest('.art-card');
    if (b) openPainting(recent, recent.findIndex(p => p.id === +b.dataset.id), true);
  };
}

// Inner Circle sign-up goes to the website's existing Netlify form ("vault-pass").
function setupVip() {
  const form = $('vipForm'), msg = $('vipMsg'), btn = $('vipSubmit');
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    msg.textContent = '';
    if (!$('vipFirst').value.trim() || !$('vipLast').value.trim()) return (msg.textContent = 'Add your first and last name.');
    if (!$('vipEmail').validity.valid || !$('vipEmail').value) return (msg.textContent = 'Add a valid email address.');
    if (!$('vipConsent').checked) return (msg.textContent = 'Tick the box so Ketan can email you.');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      // A form service from config.js (works on any host), or Netlify Forms when none is set.
      const url = (self.APP_CONFIG || {}).signupUrl;
      const data = new FormData(form);
      data.set('_subject', 'New Vault Pass request');
      const res = url
        ? await fetch(url, { method: 'POST', headers: { Accept: 'application/json' }, body: data, signal: AbortSignal.timeout?.(20000) })
        : await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() });
      if (!res.ok) throw new Error(res.status);
      if (url && String((await res.json()).success) === 'false') throw new Error('not accepted');
      $('drop').classList.add('done');
    } catch (e) {
      msg.textContent = navigator.onLine ? 'That didn’t go through. Please try again in a moment.' : 'You’re offline. Connect and try again.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Request Vault Pass';
    }
  });
}

// ---------- Vault ----------

function renderChips() {
  const chips = [['all', 'All works']].concat(Object.entries(ERAS).map(([id, e]) => [id, `${e.num} // ${e.short}`]));
  $('chips').innerHTML = chips.map(([id, label]) => `<button class="chip" data-era="${id}" aria-pressed="${id === era}">${label}</button>`).join('');
  $('chips').onclick = ev => {
    const chip = ev.target.closest('.chip');
    if (chip && chip.dataset.era !== era) { setEra(chip.dataset.era); scrollTo({ top: 0, behavior: 'smooth' }); }
  };
}

function setEra(id) {
  era = id;
  document.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.era === era));
  document.querySelector(`.chip[data-era="${era}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest' });
  renderGrid();
}

function vaultList() {
  return era === 'all' ? paintings : paintings.filter(p => p.phase === era);
}

function renderGrid() {
  const shown = vaultList();
  const intro = $('eraIntro');
  if (era === 'all') intro.hidden = true;
  else {
    const e = ERAS[era];
    intro.hidden = false;
    intro.innerHTML = `<span class="era-label">Era ${e.num} // ${e.years}</span><h3>${esc(e.title)}</h3><p>${esc(e.note)}</p>`;
  }
  const cards = shown.map((p, i) => `
    <button class="art-card" data-i="${i}" style="animation-delay:${Math.min(i, 6) * 50}ms" aria-label="${esc(p.title)}, ${p.year}">
      <div class="canvas${p.images.length > 1 ? ' multi' : ''}">
        ${p.images.map(img => {
          const tag = `<img src="img/thumb/${img.file}" width="${img.w}" height="${img.h}" alt=""
            loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async" data-loading>`;
          return p.images.length > 1 ? `<span>${tag}</span>` : tag;
        }).join('')}
      </div>
      <div class="caption"><h3>${esc(p.title)}</h3><span>${p.year}</span></div>
      <div class="details"><span>${esc(mediumShort(p))}</span><span>${esc(shortSize(p))}</span></div>
    </button>`);
  // Fill the shortest column next, so works read left to right in date order.
  const cols = Array.from({ length: columnCount() }, () => ({ h: 0, html: '' }));
  shown.forEach((p, i) => {
    const col = cols.reduce((a, b) => (b.h < a.h - 0.01 ? b : a));
    const img = p.images[0];
    col.h += img.h / img.w / (p.images.length > 1 ? 3 : 1) + 0.35;
    col.html += cards[i];
  });
  grid.innerHTML = cols.map(c => `<div class="col">${c.html}</div>`).join('');
  grid.dataset.cols = cols.length;
  grid.querySelectorAll('img').forEach(img => {
    if (img.complete) img.removeAttribute('data-loading');
    else img.onload = img.onerror = () => img.removeAttribute('data-loading');
  });
  grid.onclick = ev => {
    const card = ev.target.closest('.art-card');
    if (card) openPainting(shown, +card.dataset.i, true);
  };
}

function columnCount() {
  // As on the site: 1 column on phones, 2 below 1024px, 3 above.
  return innerWidth >= 1024 ? 3 : innerWidth >= 640 ? 2 : 1;
}
addEventListener('resize', () => { if (+grid.dataset.cols !== columnCount()) renderGrid(); });

// ---------- Viewing room ----------

function buildSlides() {
  if (slidesFor === list) return;
  slidesFor = list;
  track.innerHTML = list.map(p => `
    <div class="slide">
      <div class="stage${p.images.length > 1 ? ' multi' : ''}">
        ${p.images.map(img => `<img src="img/thumb/${img.file}" data-large="img/large/${img.file}"
          alt="${esc(p.title)}" draggable="false">`).join('')}
      </div>
    </div>`).join('');
  track.querySelectorAll('.stage').forEach(attachZoom);
}

function openPainting(source, i, push) {
  if (i < 0) return;
  list = source;
  current = -1;
  buildSlides();
  document.body.classList.add('viewing');
  viewer.classList.add('open');
  viewer.classList.remove('clean');
  track.scrollLeft = i * track.clientWidth;
  setCurrent(i);
  if (push) history.pushState({ viewer: true }, '', '#' + list[i].slug);
  $('closeBtn').focus({ preventScroll: true });
}

function closeViewer() {
  viewer.classList.remove('open');
  document.body.classList.remove('viewing');
  resetZoom(track.children[current]);
  current = -1;
}

$('closeBtn').onclick = () => {
  if (history.state?.viewer) history.back();
  else { closeViewer(); show(view); }
};

function setCurrent(i) {
  i = Math.max(0, Math.min(list.length - 1, i));
  if (i === current) return;
  if (current >= 0) resetZoom(track.children[current]);
  current = i;
  const p = list[i], e = ERAS[p.phase];
  $('count').textContent = `${String(i + 1).padStart(2, '0')} // ${String(list.length).padStart(2, '0')}`;
  $('vEra').textContent = `Era ${e.num} // ${e.title}`;
  $('vTitle').textContent = p.title;
  $('vYear').textContent = p.year;
  $('vMedium').textContent = p.medium;
  $('vSize').textContent = p.dimensions;
  $('vOrigin').textContent = p.origin;
  $('vStory').textContent = p.story;
  info.classList.remove('expanded');
  $('storyBtn').textContent = 'The story';
  $('storyBtn').setAttribute('aria-expanded', 'false');
  $('inquireBtn').href = inquiryLink(p);
  $('prevBtn').style.visibility = i > 0 ? 'visible' : 'hidden';
  $('nextBtn').style.visibility = i < list.length - 1 ? 'visible' : 'hidden';
  if (history.state?.viewer && location.hash.slice(1) !== p.slug) history.replaceState({ viewer: true }, '', '#' + p.slug);
  // Swap in the full-size image for this painting and its neighbours.
  for (let j = i - 1; j <= i + 1; j++) {
    track.children[j]?.querySelectorAll('img[data-large]').forEach(img => {
      const big = new Image();
      big.onload = () => { img.src = big.src; };
      big.src = img.dataset.large;
      img.removeAttribute('data-large');
    });
  }
}

let scrollTimer;
track.addEventListener('scroll', () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => setCurrent(Math.round(track.scrollLeft / track.clientWidth)), 60);
}, { passive: true });
addEventListener('resize', () => { if (current >= 0) track.scrollLeft = current * track.clientWidth; });

function go(step) {
  track.scrollTo({ left: (current + step) * track.clientWidth, behavior: 'smooth' });
}
$('prevBtn').onclick = () => go(-1);
$('nextBtn').onclick = () => go(1);
document.addEventListener('keydown', ev => {
  if (current < 0) return;
  if (!$('wallview').hidden) {
    if (ev.key === 'ArrowLeft') stepWall(-1);
    else if (ev.key === 'ArrowRight') stepWall(1);
    else if (ev.key === 'Escape') $('wvClose').click();
    return;
  }
  if (ev.key === 'ArrowLeft') go(-1);
  else if (ev.key === 'ArrowRight') go(1);
  else if (ev.key === 'Escape') $('closeBtn').click();
});

$('storyBtn').onclick = () => {
  const open = info.classList.toggle('expanded');
  $('storyBtn').textContent = open ? 'Hide story' : 'The story';
  $('storyBtn').setAttribute('aria-expanded', open);
};

// ---------- Pinch, double-tap and pan zoom ----------

const MAX_ZOOM = 5;

function attachZoom(stage) {
  const z = stage._zoom = { s: 1, x: 0, y: 0 };
  let start = null, lastTap = 0, tapTimer = null, moved = false;

  const origin = () => {
    const r = stage.parentElement.getBoundingClientRect();
    return { left: r.left + stage.offsetLeft, top: r.top + stage.offsetTop };
  };
  const point = (t, o) => ({ x: t.clientX - o.left, y: t.clientY - o.top });

  stage.addEventListener('touchstart', ev => {
    moved = false;
    const o = origin();
    if (ev.touches.length === 2) {
      ev.preventDefault();
      const a = point(ev.touches[0], o), b = point(ev.touches[1], o);
      start = { kind: 'pinch', o, d: dist(a, b), mid: midpoint(a, b), ...z };
    } else if (ev.touches.length === 1 && z.s > 1) {
      start = { kind: 'pan', o, p: point(ev.touches[0], o), ...z };
    }
  }, { passive: false });

  stage.addEventListener('touchmove', ev => {
    moved = true;
    if (!start) return;
    ev.preventDefault();
    if (start.kind === 'pinch' && ev.touches.length >= 2) {
      const a = point(ev.touches[0], start.o), b = point(ev.touches[1], start.o);
      const s = clamp(start.s * dist(a, b) / start.d, 1, MAX_ZOOM);
      const mid = midpoint(a, b);
      setZoom(stage, s, mid.x - (start.mid.x - start.x) * s / start.s, mid.y - (start.mid.y - start.y) * s / start.s, false);
    } else if (start.kind === 'pan' && ev.touches.length === 1) {
      const p = point(ev.touches[0], start.o);
      setZoom(stage, z.s, start.x + p.x - start.p.x, start.y + p.y - start.p.y, false);
    }
  }, { passive: false });

  stage.addEventListener('touchend', ev => {
    if (ev.touches.length === 0) start = null;
    else if (ev.touches.length === 1 && z.s > 1) {
      const o = origin();
      start = { kind: 'pan', o, p: point(ev.touches[0], o), ...z };
    }
    if (z.s < 1.05 && z.s !== 1) resetZoom(stage.parentElement);
    if (moved || ev.changedTouches.length !== 1 || ev.touches.length) return;
    const now = Date.now();
    if (now - lastTap < 300) {
      clearTimeout(tapTimer);
      lastTap = 0;
      ev.preventDefault();
      toggleZoom(stage, point(ev.changedTouches[0], origin()));
    } else {
      lastTap = now;
      tapTimer = setTimeout(() => viewer.classList.toggle('clean'), 300);
    }
  });

  // Mouse: double-click to zoom, drag to pan.
  stage.addEventListener('dblclick', ev => { toggleZoom(stage, point(ev, origin())); });
  stage.addEventListener('mousedown', ev => {
    if (z.s === 1) return;
    ev.preventDefault();
    const o = origin(), p0 = point(ev, o), x0 = z.x, y0 = z.y;
    const move = e => { const p = point(e, o); setZoom(stage, z.s, x0 + p.x - p0.x, y0 + p.y - p0.y, false); };
    const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up); };
    addEventListener('mousemove', move);
    addEventListener('mouseup', up);
  });
}

function toggleZoom(stage, p) {
  const z = stage._zoom;
  if (z.s > 1) return setZoom(stage, 1, 0, 0, true);
  const s = 2.5;
  setZoom(stage, s, p.x - p.x * s, p.y - p.y * s, true);
}

function setZoom(stage, s, x, y, animate) {
  const z = stage._zoom, w = stage.clientWidth, h = stage.clientHeight;
  // Keep the zoomed painting covering the frame, so it can't be dragged off screen.
  z.s = s;
  z.x = clamp(x, w - w * s, 0);
  z.y = clamp(y, h - h * s, 0);
  stage.style.transition = animate ? 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
  stage.style.transform = s === 1 ? '' : `translate(${z.x}px, ${z.y}px) scale(${s})`;
  stage.classList.toggle('zoomed', s > 1);
  track.classList.toggle('locked', s > 1);
  if (s > 1) viewer.classList.add('clean');
}

function resetZoom(slide) {
  const stage = slide?.querySelector('.stage');
  if (stage && stage._zoom.s !== 1) setZoom(stage, 1, 0, 0, false);
}

// ---------- Share and inquire ----------

function paintingUrl(p) {
  return location.href.split('#')[0] + '#' + p.slug;
}

$('shareBtn').onclick = async () => {
  const p = list[current];
  const data = { title: `${p.title} (${p.year}), Ketan Duggal`, text: `${p.title} (${p.year}) by Ketan Duggal`, url: paintingUrl(p) };
  try {
    if (navigator.share) return await navigator.share(data);
    await navigator.clipboard.writeText(data.url);
    toast('Link copied');
  } catch (e) {
    if (e.name !== 'AbortError') toast('Could not share this painting');
  }
};

function inquiryLink(p) {
  const subject = `Inquiry: ${p.title} (${p.year})`;
  const body = `Hello Ketan,\n\nI'm interested in "${p.title}" (${p.year}, ${p.medium}, ${p.dimensions}).\n\n${paintingUrl(p)}\n\nName:\nPhone:\n`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ---------- Gold dust behind the hero, as on the website ----------

function startDust() {
  const canvas = $('dust'), ctx = canvas.getContext('2d');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let w, h, dots = [], visible = true;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = Array.from({ length: Math.round(w * h / 9000) }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.8 + 0.6,
      vy: -(Math.random() * 0.25 + 0.05), vx: (Math.random() - 0.5) * 0.15, a: Math.random() * 0.5 + 0.25
    }));
  };
  resize();
  addEventListener('resize', resize);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  (function frame() {
    if (visible && view === 'home' && current < 0) {
      const rgb = getComputedStyle(document.documentElement).getPropertyValue('--dust-rgb').trim();
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.y < -4) { d.y = h + 4; d.x = Math.random() * w; }
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${d.a})`;
        ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  })();
}

// ---------- See it on your wall, to scale ----------

// A three-seat sofa and a standing person, both drawn to real size in centimetres.
const SOFA_SVG = `<svg viewBox="0 0 220 86" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="sfBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8a296"/><stop offset="1" stop-color="#8a847a"/></linearGradient>
    <linearGradient id="sfSeat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b4aea2"/><stop offset="1" stop-color="#958f84"/></linearGradient>
    <linearGradient id="sfArm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8c867b"/><stop offset="0.55" stop-color="#a9a397"/><stop offset="1" stop-color="#8c867b"/></linearGradient>
    <linearGradient id="sfLeg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5e3f27"/><stop offset="1" stop-color="#8d6640"/></linearGradient>
  </defs>
  <path d="M17 70h7l-2 16h-3z M196 70h7l-2 16h-3z" fill="url(#sfLeg)"/>
  <rect x="12" y="6" width="196" height="56" rx="9" fill="#837d72"/>
  <rect x="24" y="10" width="56" height="40" rx="7" fill="url(#sfBack)"/>
  <rect x="82" y="10" width="56" height="40" rx="7" fill="url(#sfBack)"/>
  <rect x="140" y="10" width="56" height="40" rx="7" fill="url(#sfBack)"/>
  <rect x="32" y="27" width="24" height="21" rx="6" fill="#c29848" transform="rotate(-8 44 37)"/>
  <rect x="10" y="56" width="200" height="16" rx="4" fill="#8a8479"/>
  <rect x="10" y="69" width="200" height="3" rx="1.5" fill="#6d685e"/>
  <rect x="24" y="45" width="85" height="15" rx="5" fill="url(#sfSeat)"/>
  <rect x="111" y="45" width="85" height="15" rx="5" fill="url(#sfSeat)"/>
  <rect x="0" y="28" width="26" height="44" rx="9" fill="url(#sfArm)"/>
  <rect x="194" y="28" width="26" height="44" rx="9" fill="url(#sfArm)"/></svg>`;
const PERSON_SVG = `<svg viewBox="0 0 60 172" preserveAspectRatio="none" aria-hidden="true">
  <ellipse cx="30" cy="11.5" rx="7.2" ry="9.6"/>
  <path d="M26 20v7c-6 1-13 2-15 5l4 8c0 12 1 22 .5 30-1.5 8-2 14-1.5 20 1 20 2.5 38 4 52 1 10 1.5 18 1.5 24-2.5 2-3.5 4-3 6h12c0-4-1-6-1.5-8 0-12 .5-24 1-36 .5-13 1-26 2-34 1 8 1.5 21 2 34 .5 12 1 24 1 36-.5 2-1.5 4-1.5 8h12c.5-2-.5-4-3-6 0-6 .5-14 1.5-24 1.5-14 3-32 4-52 .5-6 0-12-1.5-20-.5-8 .5-18 .5-30l4-8c-2-3-9-4-15-5v-7z"/>
  <path d="M11 31c-4 3-4 13-3.5 21 .5 10-.5 20-.5 28-.5 6-1 10 .5 15 1.5 2 3.5 1 3.5-2 0-5 .5-9 1-13 .5-10 1.5-20 2-28 .5-6 1-12 1-16z"/>
  <path d="M49 31c4 3 4 13 3.5 21-.5 10 .5 20 .5 28 .5 6 1 10-.5 15-1.5 2-3.5 1-3.5-2 0-5-.5-9-1-13-.5-10-1.5-20-2-28-.5-6-1-12-1-16z"/></svg>`;
const REFS = { sofa: { w: 220, h: 86, gap: 0, label: '220 cm sofa', svg: SOFA_SVG }, person: { w: 60, h: 172, gap: 30, label: '172 cm person', svg: PERSON_SVG } };
let wallIndex = -1, wallRef = store('wallRef') || 'sofa';

// Real size in cm, width and height. The stated sizes don't always list width first,
// so the orientation word (or, failing that, the photo) decides which side is the long one.
function realSize(p) {
  const [a, b] = (p.dimensions.match(/\d+(\.\d+)?/g) || ['60', '60']).map(Number);
  const long = Math.max(a, b), short = Math.min(a, b);
  const img = p.images[0], label = p.dimensions.toLowerCase();
  if (label.includes('square')) return { w: long, h: long };
  const tall = label.includes('portrait') || (!/landscape|panorama/.test(label) && img.h > img.w);
  return tall ? { w: short, h: long } : { w: long, h: short };
}

function wallLayout(p) {
  const size = realSize(p);
  if (p.images.length === 1) return { panels: [size], gap: 0, w: size.w, h: size.h };
  // Triptych: the stated size is per panel.
  const panel = { w: size.w, h: size.h }, gap = 6;
  return { panels: p.images.map(() => panel), gap, w: panel.w * p.images.length + gap * (p.images.length - 1), h: panel.h };
}

function setupWall() {
  $('wallBtn').onclick = openWall;
  $('wvClose').onclick = () => {
    if (history.state?.wall) history.back();
    else closeWall();
  };
  $('wvPrev').onclick = () => stepWall(-1);
  $('wvNext').onclick = () => stepWall(1);
  document.querySelectorAll('[data-ref]').forEach(b => b.onclick = () => {
    wallRef = b.dataset.ref;
    store('wallRef', wallRef);
    renderWall();
  });
  addEventListener('resize', () => { if (!$('wallview').hidden) renderWall(); });
}

function openWall() {
  if (current < 0) return;
  wallIndex = current;
  $('wallview').hidden = false;
  history.pushState({ viewer: true, wall: true }, '', location.hash);
  renderWall();
  $('wvClose').focus({ preventScroll: true });
}

// Back to the viewing room, on whichever painting the wall view ended on.
function closeWall() {
  if ($('wallview').hidden) return;
  $('wallview').hidden = true;
  if (current >= 0 && wallIndex !== current) {
    track.scrollLeft = wallIndex * track.clientWidth;
    setCurrent(wallIndex);
  }
  wallIndex = -1;
}

function stepWall(step) {
  const i = clamp(wallIndex + step, 0, list.length - 1);
  if (i === wallIndex) return;
  wallIndex = i;
  renderWall();
}

function renderWall() {
  const p = list[wallIndex], art = wallLayout(p), ref = REFS[wallRef];
  document.querySelectorAll('[data-ref]').forEach(b => b.setAttribute('aria-pressed', b.dataset.ref === wallRef));
  $('wvTitle').textContent = p.title;
  $('wvYear').textContent = p.year;
  const what = p.images.length > 1
    ? `${p.images.length} panels of ${art.panels[0].w} × ${art.panels[0].h} cm, ${art.gap} cm apart`
    : `${art.w} cm wide by ${art.h} cm high`;
  $('wvNote').textContent = `Shown to scale: ${what}, next to a ${ref.label}.`;
  $('wvPrev').style.visibility = wallIndex > 0 ? 'visible' : 'hidden';
  $('wvNext').style.visibility = wallIndex < list.length - 1 ? 'visible' : 'hidden';

  // A 2.8 m wall, wide enough for the painting and the reference with room either side.
  const scene = $('wvScene'), W = scene.clientWidth, H = scene.clientHeight;
  const top = $('wallview').querySelector('.wv-bar').offsetHeight + 8;
  const group = wallRef === 'sofa' ? Math.max(art.w, ref.w) : ref.w + ref.gap + art.w;
  const roomW = Math.max(320, group + 140), roomH = 280, floorCm = 14;
  const s = Math.min(W / roomW, (H - top) / (roomH + floorCm));
  const floorY = H - floorCm * s;
  const cm = v => v * s;

  // Hang the centre at about 150 cm, higher when a sofa is below, and never above the ceiling.
  let centre = wallRef === 'sofa' ? Math.max(150, ref.h + 22 + art.h / 2) : 150;
  centre = Math.min(centre, roomH - 10 - art.h / 2);
  const artTop = floorY - cm(centre + art.h / 2);
  let artLeft, refLeft;
  if (wallRef === 'sofa') {
    artLeft = W / 2 - cm(art.w) / 2;
    refLeft = W / 2 - cm(ref.w) / 2;
  } else {
    refLeft = W / 2 - cm(group) / 2;
    artLeft = refLeft + cm(ref.w + ref.gap);
  }

  const panels = p.images.map((img, i) => `<span style="width:${cm(art.panels[i].w)}px;height:${cm(art.panels[i].h)}px">
    <img src="img/thumb/${img.file}" alt="${i ? '' : esc(p.title)}"></span>`).join('');
  const refTop = floorY - cm(ref.h) + 1;
  $('wvStage').innerHTML = `
    <div class="wv-floor" style="height:${H - floorY}px"></div>
    <div class="wv-ref-shape" style="left:${refLeft}px;top:${refTop}px;width:${cm(ref.w)}px;height:${cm(ref.h)}px">${ref.svg}</div>
    <span class="wv-ref-label" style="left:${refLeft + cm(ref.w) / 2}px;top:${floorY + 4}px">${ref.label}</span>
    <div class="wv-art" style="left:${artLeft}px;top:${artTop}px;gap:${cm(art.gap)}px">${panels}</div>
    <div class="wv-dim w" style="left:${artLeft}px;top:${artTop - 17}px;width:${cm(art.w)}px"><span>${art.w} cm</span></div>
    <div class="wv-dim h" style="left:${artLeft + cm(art.w) + 14}px;top:${artTop}px;height:${cm(art.h)}px"><span>${art.h} cm</span></div>`;
}

// ---------- Drop alerts (Firebase Cloud Messaging) ----------

const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const ALERT_TEXT = {
  off: ['Turn on drop alerts', 'Turn on', 'Get a phone notification the moment a drop goes live.'],
  on: ['Drop alerts on ✓', 'On ✓', 'You will get a notification when a drop goes live. Tap again to turn alerts off.'],
  busy: ['Turning on…', '…', 'Your phone will ask if the app can send notifications.'],
  blocked: ['Alerts blocked', 'Blocked', 'Notifications are blocked for this app. Allow them in your browser or phone settings, then come back.'],
  'ios-install': ['Turn on drop alerts', 'Turn on', 'On iPhone, add the app to your Home Screen first (Share, then Add to Home Screen), then turn alerts on from there.'],
  'not-ready': ['Drop alerts coming soon', 'Soon', 'Phone alerts switch on once the app is live.'],
  unsupported: ['Alerts not available', 'Not here', 'This browser can’t show notifications. Try Chrome, or the app from your Home Screen on iPhone.']
};
let alertState = 'off', fcm = null;

function alertsStatus() {
  const cfg = self.APP_CONFIG || {};
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!cfg.firebase || !cfg.vapidKey) return 'not-ready';
  if (ios && !standalone) return 'ios-install';
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  return Notification.permission === 'granted' && store('alerts') === 'on' ? 'on' : 'off';
}

function showAlerts(state) {
  alertState = state;
  const [big, small, note] = ALERT_TEXT[state];
  document.querySelectorAll('[data-alerts]').forEach(b => {
    b.textContent = b.classList.contains('pill') ? small : big;
    b.setAttribute('aria-pressed', state === 'on');
    b.disabled = state === 'busy';
  });
  document.querySelectorAll('[data-alerts-note]').forEach(n => { n.textContent = note; });
}

function setupAlerts() {
  showAlerts(alertsStatus());
  document.querySelectorAll('[data-alerts]').forEach(b => b.onclick = toggleAlerts);
  // Keep the token fresh and show drops that arrive while the app is open.
  if (alertState === 'on') {
    const refresh = () => alertsToken().catch(e => console.warn('Drop alerts:', e));
    'requestIdleCallback' in window ? requestIdleCallback(refresh, { timeout: 8000 }) : setTimeout(refresh, 4000);
  }
}

async function toggleAlerts() {
  if (alertState === 'on') {
    try { const { msg, messaging } = await firebaseMessaging(); await msg.deleteToken(messaging); } catch (e) { /* turned off locally either way */ }
    store('alerts', 'off');
    showAlerts('off');
    return toast('Drop alerts are off');
  }
  if (alertState === 'ios-install') {
    $('iosHint').classList.add('show');
    return toast('Add the app to your Home Screen first');
  }
  if (alertState !== 'off') return toast(ALERT_TEXT[alertState][2]);

  showAlerts('busy');
  try {
    if (await Notification.requestPermission() !== 'granted') return showAlerts(alertsStatus());
    await alertsToken();
    store('alerts', 'on');
    showAlerts('on');
    toast('Drop alerts are on');
  } catch (e) {
    console.warn('Drop alerts:', e);
    showAlerts(alertsStatus());
    toast('Could not turn on alerts. Try again.');
  }
}

async function alertsToken() {
  const { msg, messaging, reg } = await firebaseMessaging();
  const token = await msg.getToken(messaging, { vapidKey: self.APP_CONFIG.vapidKey, serviceWorkerRegistration: reg });
  // Handy for "Send test message" in the Firebase console.
  console.info('Drop alerts token:', token);
  return token;
}

// Firebase loads only when someone uses alerts. Its worker lives in push/ so it
// never collides with the offline worker that controls the rest of the app.
function firebaseMessaging() {
  fcm ||= (async () => {
    const reg = await navigator.serviceWorker.register('push/firebase-messaging-sw.js', { scope: 'push/' });
    const [core, msg] = await Promise.all([import(FIREBASE_SDK + 'firebase-app.js'), import(FIREBASE_SDK + 'firebase-messaging.js')]);
    const messaging = msg.getMessaging(core.initializeApp(self.APP_CONFIG.firebase));
    msg.onMessage(messaging, payload => toast(payload.notification?.title || 'A new drop is live'));
    return { msg, messaging, reg };
  })().catch(e => { fcm = null; throw e; });
  return fcm;
}

// ---------- Install and offline ----------

function setupInstall() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone) return;

  let deferred;
  addEventListener('beforeinstallprompt', ev => {
    ev.preventDefault();
    deferred = ev;
    $('installBtn').hidden = false;
  });
  $('installBtn').onclick = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    $('installBtn').hidden = true;
  };
  addEventListener('appinstalled', () => { $('installBtn').hidden = true; });

  // iPhone and iPad have no install prompt, so show a one-time hint instead.
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios && !store('iosHintDismissed')) {
    setTimeout(() => $('iosHint').classList.add('show'), 5000);
    $('iosHintClose').onclick = () => { $('iosHint').classList.remove('show'); store('iosHintDismissed', '1'); };
  }
}

async function registerWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('sw.js');
    const reg = await navigator.serviceWorker.ready;
    // Once the page is idle, fetch the full-size images so every painting works offline.
    const warm = () => reg.active?.postMessage('cache-large');
    'requestIdleCallback' in window ? requestIdleCallback(warm, { timeout: 8000 }) : setTimeout(warm, 4000);
  } catch (e) { /* offline support is a bonus; the app works without it */ }
}

// ---------- Helpers ----------

function mediumWord(p) {
  const m = p.medium.toLowerCase();
  if (m.includes('resin')) return 'Resin';
  if (m.includes('collage')) return 'Collage';
  if (m.includes('mixed')) return 'Mixed';
  if (m.includes('acrylic')) return 'Acrylic';
  return 'Oil';
}
function mediumShort(p) { return p.medium.replace(/\s*\(.*\)$/, '').replace(/ paint/i, '').replace(/ on canvas/i, ''); }
function shortSize(p) { return p.dimensions.replace(/\s*\(.*\)$/, '').replace(' each', ''); }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function midpoint(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
function store(k, v) {
  try { return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch (e) { return null; }
}
let toastTimer;
function toast(msg) {
  $('toast').textContent = msg;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2000);
}
