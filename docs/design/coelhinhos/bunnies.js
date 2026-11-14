// Coelhinhos que passeiam pelo site (RF40–RF48, RNF09–RNF10, ADR-012).
// Uso: const b = startBunnies({ perchSelector: '[data-perch]' });
//      b.emit('item:salvo') | b.emit('combo:dado') | b.setEnabled(false) | b.setCalm(true)
import { buildSprites, SIZE, FEET_Y, HEART, ZZZ } from './sprites.js';

const SCALE = 2;                 // 40px → 80px (desenho de 32px + margem)
const PX = SIZE * SCALE;
const FEET = FEET_Y * SCALE;     // distância do topo do sprite até as patas
const HOP_MAX = 120;             // distância máxima de um pulo
const SLEEP_AFTER = 25_000;      // cochila depois de 25s sem ninguém mexer

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function startBunnies({ perchSelector = '[data-perch]', calm = false } = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sprites = buildSprites();

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '50' });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
  };
  resize(); addEventListener('resize', resize);

  const state = { enabled: true, calm, lastInput: performance.now(), particles: [] };
  const floorY = () => H - FEET - (state.calm ? 84 : 6);   // no celular, acima da barra de navegação

  // ---------- plataformas ----------
  const perches = () => [...document.querySelectorAll(perchSelector)]
    .filter((el) => { const r = el.getBoundingClientRect(); return r.width > PX && r.top > FEET + 10 && r.top < H - 20; });
  const perchSpot = (el, side) => {
    const r = el.getBoundingClientRect();
    const minX = r.left - 8, maxX = r.right - PX + 8;
    const x = side === 'left' ? minX + 6 : side === 'right' ? maxX - 6 : rand(minX, maxX);
    return { x, y: r.top - FEET + 2, el };
  };
  const floorSpot = (x = rand(8, W - PX - 8)) => ({ x: Math.max(8, Math.min(W - PX - 8, x)), y: floorY(), el: null });

  // ---------- coelho ----------
  function makeBunny(fur, x) {
    return {
      fur, x, y: floorY(), perch: null, dir: fur === 'chocolate' ? 1 : -1,
      frame: 'sit', mode: 'idle',        // idle | hop | sleep | react
      hops: [], hop: null, until: 0, next: performance.now() + rand(800, 2500),
      blinkAt: performance.now() + rand(1500, 4000), noseAt: performance.now() + rand(2000, 5000),
      squash: 0, react: null,
    };
  }
  const bunnies = [makeBunny('chocolate', W * 0.35), makeBunny('caramelo', W * 0.55)];
  const [laura, vitor] = bunnies;

  // Planeja uma sequência de pulos até o alvo (cada pulo ≤ HOP_MAX)
  function goTo(b, target, then) {
    const hops = [];
    let { x, y } = b;
    const dx = target.x - x, dy = target.y - y;
    const n = Math.max(1, Math.ceil(Math.abs(dx) / HOP_MAX), Math.abs(dy) > 160 ? 2 : 1);
    for (let i = 1; i <= n; i++) {
      const last = i === n;
      const nx = x + dx / n, ny = last ? target.y : (y + dy / n);
      hops.push({ x0: x, y0: y, x1: nx, y1: ny, h: Math.max(26, (y - ny) + 34), el: last ? target.el : null });
      x = nx; y = ny;
    }
    b.hops = hops; b.mode = 'hop'; b.perch = null; b.then = then;
  }

  function startHop(b, now) {
    const hop = b.hops.shift();
    const dist = Math.hypot(hop.x1 - hop.x0, hop.y1 - hop.y0);
    b.hop = { ...hop, t0: now + 120, dur: 280 + dist * 1.6 };  // 120ms agachado antes do pulo
    if (Math.abs(hop.x1 - hop.x0) > 2) b.dir = Math.sign(hop.x1 - hop.x0);
    b.squash = 1;
  }

  function emitHeart(x, y, n = 1) {
    for (let i = 0; i < n; i++) state.particles.push({ kind: 'heart', x: x + rand(-14, 14), y, vy: rand(-0.7, -0.45), born: performance.now() + i * 120, life: 1300 });
  }

  // ---------- comportamentos ----------
  function chooseAction(b, now) {
    const other = b === laura ? vitor : laura;
    const roll = Math.random();
    if (state.calm) {
      if (roll < 0.55) return goTo(b, floorSpot(b.x + rand(-90, 90)));
      if (roll < 0.75) return groom(b, now);
      return (b.next = now + rand(1500, 3500));
    }
    const ps = perches();
    if (roll < 0.38 && ps.length) return goTo(b, perchSpot(pick(ps)));
    if (roll < 0.52) return goTo(b, floorSpot());
    if (roll < 0.64) return meet(b, other);
    if (roll < 0.72) return chase(b, other);
    if (roll < 0.86) return groom(b, now);
    if (roll < 0.94 && state.cursor) return goTo(b, nearCursor());
    b.next = now + rand(1500, 3500);
  }

  function groom(b, now) { b.mode = 'react'; b.react = 'groom'; b.until = now + rand(1400, 2400); }

  function meet(b, other) {
    if (other.mode !== 'idle') return;
    const side = other.x > W / 2 ? -1 : 1;
    const spot = other.perch ? { x: other.x + side * (PX - 6), y: other.y, el: other.perch } : floorSpot(other.x + side * (PX - 6));
    goTo(b, spot, () => {
      const now = performance.now();
      b.dir = Math.sign(other.x - b.x) || 1; other.dir = -b.dir;   // um de frente para o outro
      [b, other].forEach((x) => { x.mode = 'react'; x.react = 'happy'; x.until = now + 1500; });
      emitHeart((b.x + other.x) / 2 + PX / 2, Math.min(b.y, other.y), 2);
    });
  }

  function chase(b, other) {
    if (other.mode !== 'idle' || state.calm) return;
    const away = floorSpot(other.x + (other.x > W / 2 ? -260 : 260));
    goTo(other, away);
    goTo(b, floorSpot(away.x + (away.x > other.x ? -PX : PX)), () => emitHeart(b.x + PX / 2, b.y));
  }

  function nearCursor() {
    const { x, y } = state.cursor;
    const near = perches().map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => Math.abs(r.top - y) < 140).sort((a, c) => Math.abs(a.r.left - x) - Math.abs(c.r.left - x))[0];
    return near ? perchSpot(near.el) : floorSpot(x - PX / 2);
  }

  // ---------- eventos do app (RF46) ----------
  function celebrate(times, hearts) {
    const now = performance.now();
    bunnies.forEach((b, i) => {
      b.mode = 'react'; b.react = 'jump'; b.jumps = times; b.jumpT0 = now + i * 140; b.until = now + times * 420 + 300;
      emitHeart(b.x + PX / 2, b.y, hearts);
    });
  }
  function emit(event) {
    wake();
    if (event === 'item:salvo') celebrate(2, 1);
    if (event === 'combo:dado') celebrate(4, 4);
  }

  // curiosidade ao digitar
  document.addEventListener('focusin', (e) => {
    if (!e.target.matches('input, textarea') || state.calm || reduced) return;
    wake();
    const curious = (b) => () => { b.dir = b === laura ? 1 : -1; b.mode = 'react'; b.react = 'look'; b.until = performance.now() + 3500; };
    goTo(laura, perchSpot(e.target, 'left'), curious(laura));
    goTo(vitor, perchSpot(e.target, 'right'), curious(vitor));
  });

  // carinho: só o corpo do coelho é "clicável" (o canvas não bloqueia cliques)
  document.addEventListener('pointerdown', (e) => {
    if (!state.enabled) return;
    const hit = bunnies.find((b) => e.clientX >= b.x + 10 && e.clientX <= b.x + PX - 10 && e.clientY >= b.y + 14 && e.clientY <= b.y + FEET);
    if (!hit) return;
    e.preventDefault(); e.stopPropagation();
    wake();
    hit.mode = 'react'; hit.react = 'happy'; hit.until = performance.now() + 1300; hit.hops = []; hit.hop = null;
    emitHeart(hit.x + PX / 2, hit.y, 1);
  }, true);

  // inatividade → dormir; qualquer interação acorda
  function wake() {
    if (state.sleepLock && performance.now() < state.sleepLock) return;
    state.lastInput = performance.now();
    bunnies.forEach((b) => { if (b.mode === 'sleep') { b.mode = 'idle'; b.next = performance.now() + rand(300, 900); } });
  }
  ['pointermove', 'keydown', 'scroll', 'touchstart'].forEach((ev) => addEventListener(ev, (e) => {
    if (ev === 'pointermove') state.cursor = { x: e.clientX, y: e.clientY };
    wake();
  }, { passive: true }));

  // ---------- loop ----------
  function update(b, now) {
    // acompanha a plataforma quando a página rola
    if (b.perch && b.mode !== 'hop') {
      const r = b.perch.getBoundingClientRect();
      b.y = r.top - FEET + 2;
      if (r.top < 0 || r.top > H) { b.perch = null; goTo(b, floorSpot(b.x)); }
    } else if (!b.perch && b.mode !== 'hop' && b.mode !== 'react') {
      b.y = floorY();
    }

    if (b.mode === 'hop') {
      if (!b.hop) { if (b.hops.length) startHop(b, now); else { b.mode = 'idle'; b.next = now + rand(1200, 3200); b.then?.(); b.then = null; } }
      if (b.hop) {
        const t = Math.min(1, Math.max(0, (now - b.hop.t0) / b.hop.dur));
        if (now < b.hop.t0) { b.squash = 1; return; }
        b.x = b.hop.x0 + (b.hop.x1 - b.hop.x0) * t;
        b.y = b.hop.y0 + (b.hop.y1 - b.hop.y0) * t - 4 * b.hop.h * t * (1 - t);
        b.squash = t < 0.5 ? -1 : -0.4;
        if (t >= 1) { b.perch = b.hop.el; b.hop = null; b.squash = 1; b.landAt = now; }
      }
      return;
    }

    if (b.mode === 'react') {
      if (b.react === 'jump') {
        const t = (now - b.jumpT0) / 420;
        const k = t - Math.floor(t);
        b.jumpOffset = t > 0 && t < b.jumps ? -4 * 28 * k * (1 - k) : 0;
        b.squash = t > 0 && t < b.jumps ? (k < 0.15 || k > 0.9 ? 1 : -1) : 0;
      }
      if (now > b.until) { b.mode = 'idle'; b.react = null; b.jumpOffset = 0; b.next = now + rand(900, 2500); }
      return;
    }

    if (b.mode === 'idle') {
      if (now - state.lastInput > SLEEP_AFTER) { b.mode = 'sleep'; return; }
      if (now > b.next && !reduced) chooseAction(b, now);
    }
  }

  function frameFor(b, now) {
    if (b.mode === 'sleep') return 'sleep';
    if (b.mode === 'hop') return b.squash > 0 ? 'crouch' : 'air';
    if (b.mode === 'react') {
      if (b.react === 'groom') return Math.floor(now / 260) % 2 ? 'groom' : 'groom2';
      if (b.react === 'look') return now > b.blinkAt && now < b.blinkAt + 140 ? 'blink' : 'look';
      if (b.react === 'jump') return b.squash > 0 ? 'crouch' : b.squash < 0 ? 'air' : 'happy';
      return 'happy';
    }
    if (b.landAt) return 'crouch';
    if (now > b.blinkAt) { if (now > b.blinkAt + 140) b.blinkAt = now + rand(2200, 5200); return 'blink'; }
    if (now > b.noseAt) { if (now > b.noseAt + 600) b.noseAt = now + rand(2500, 6000); return Math.floor(now / 120) % 2 ? 'nose' : 'sit'; }
    return 'sit';
  }

  function drawPixels(map, x, y, s, colors) {
    map.forEach((row, r) => [...row].forEach((ch, c) => { if (colors[ch]) { ctx.fillStyle = colors[ch]; ctx.fillRect(x + c * s, y + r * s, s, s); } }));
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;

    for (const b of bunnies) {
      if (b.landAt && now - b.landAt > 120) { b.squash = 0; b.landAt = null; }
      const img = sprites[b.fur][frameFor(b, now)];
      // a pose já mostra o agachar/esticar; aqui só a respiração no sono
      const breathe = b.mode === 'sleep' ? 1 + Math.sin(now / 650) * 0.025 : 1;
      const w = PX, h = Math.round(PX * breathe);
      const x = Math.round(b.x), y = Math.round(b.y + (b.jumpOffset || 0) + (PX - h));
      // sombrinha no chão/plataforma
      const groundY = b.mode === 'hop' && b.hop ? b.hop.y0 + (b.hop.y1 - b.hop.y0) * Math.min(1, Math.max(0, (now - b.hop.t0) / b.hop.dur)) : b.y;
      ctx.fillStyle = 'rgba(28,26,74,.16)';
      ctx.beginPath(); ctx.ellipse(b.x + PX / 2, groundY + FEET - 1, PX * 0.26, 3, 0, 0, Math.PI * 2); ctx.fill();
      if (b.dir < 0) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, h); ctx.restore(); }
      else ctx.drawImage(img, x, y, w, h);

      if (b.mode === 'sleep' && Math.floor(now / 900) !== b.zTick) {
        b.zTick = Math.floor(now / 900);
        const size = [2, 3, 4][b.zTick % 3];   // Zzz em tamanhos crescentes
        state.particles.push({ kind: 'z', size, x: b.dir > 0 ? b.x + PX - 20 : b.x + 8, y: b.y + FEET - 30, vy: -0.32, born: now, life: 2600 });
      }
    }

    state.particles = state.particles.filter((p) => now - p.born < p.life);
    for (const p of state.particles) {
      const age = now - p.born; if (age < 0) continue;
      const a = 1 - age / p.life;
      ctx.globalAlpha = a;
      const y = p.y + p.vy * age * 0.12;
      if (p.kind === 'heart') drawPixels(HEART, p.x - 7, y - 10, 2, { o: '#A8124F', h: '#FF5EA0' });
      else { const s = p.size || 2; drawPixels(ZZZ, p.x + Math.sin(age / 300) * 5 - s * 2, y - s * 4, s, { z: '#5B74F0' }); }
      ctx.globalAlpha = 1;
    }
  }

  let raf = 0;
  function loop(now) {
    if (state.enabled) { bunnies.forEach((b) => update(b, now)); draw(now); }
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);   // o navegador pausa o rAF com a aba em segundo plano

  return {
    emit,
    sleepNow() { state.lastInput = -1e9; state.sleepLock = performance.now() + 2500; },
    setEnabled(on) { state.enabled = on; canvas.style.display = on ? '' : 'none'; },
    setCalm(on) { state.calm = on; bunnies.forEach((b) => { b.perch = null; goTo(b, floorSpot(b.x)); }); },
    destroy() { cancelAnimationFrame(raf); canvas.remove(); },
  };
}
