/* =========================================================
   Gódula · Clínica Estética y Bienestar
   main.js — vanilla, sin dependencias
   Módulos: tema · código bonus + WhatsApp · formularios · música ambiente
            · bienvenida · header/nav · reveal · tilt/parallax
   ========================================================= */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const root = document.documentElement;
  const body = document.body;
  const WA_NUMBER = body.dataset.whatsapp;           // 595987302505
  const CLINIC = 'Gódula';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const storage = {
    get: (k, area = 'localStorage') => { try { return window[area].getItem(k); } catch { return null; } },
    set: (k, v, area = 'localStorage') => { try { window[area].setItem(k, v); } catch { /* modo privado */ } },
  };

  /* ---------------------------------------------------------
     1. TEMA (claro / oscuro)
     --------------------------------------------------------- */
  const themeBtn = $('[data-theme-toggle]');
  const themeMeta = $('meta[name="theme-color"]');

  function applyTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    themeMeta?.setAttribute('content', dark ? '#1C1412' : '#F9F6F0');
    themeBtn?.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    $('use', themeBtn)?.setAttribute('href', dark ? '#i-sun' : '#i-moon');
  }

  applyTheme(storage.get('godula-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  themeBtn?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storage.set('godula-theme', next);
  });

  /* ---------------------------------------------------------
     2. CÓDIGO BONUS + WHATSAPP
     Cada mensaje usa el código visible y luego se genera uno nuevo.
     --------------------------------------------------------- */
  const codeEl = $('[data-code]');

  const randomCode = (avoid) => {
    let c;
    do {
      const n = new Uint32Array(1);
      crypto.getRandomValues(n);
      c = String(100 + (n[0] % 900));                // 100–999: siempre 3 dígitos
    } while (c === avoid);
    return c;
  };

  let currentCode = randomCode();

  function renderCode() {
    if (!codeEl) return;
    codeEl.textContent = currentCode;
    codeEl.classList.remove('is-changing');
    void codeEl.offsetWidth;                          // reinicia la animación
    codeEl.classList.add('is-changing');
  }
  function rotateCode() { currentCode = randomCode(currentCode); renderCode(); }
  renderCode();

  $('[data-code-refresh]')?.addEventListener('click', rotateCode);

  const waURL = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  const bookingText = ({ name, service, when } = {}) => {
    const lines = ['Buenas, deseo agendar un servicio estético con el bonus de la página web.'];
    if (service) lines.push(`Servicio: ${service}`);
    if (name) lines.push(`Nombre: ${name}`);
    if (when) lines.push(`Horario: ${when}`);
    lines.push(`Código de bonus: ${currentCode}`);
    return lines.join('\n');
  };

  /** Abre WhatsApp desde un gesto del usuario (un <a> evita bloqueos de pop-up). */
  function openWhatsApp(text) {
    const a = document.createElement('a');
    a.href = waURL(text);
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(rotateCode, 600);
  }

  // Botón flotante: el mensaje se arma en el click, con el código vigente
  $('[data-wa-float]')?.addEventListener('click', (e) => {
    e.currentTarget.href = waURL(bookingText());
    setTimeout(rotateCode, 600);
  });

  // Enlace de contacto: consulta general (sin código)
  const waLink = $('[data-wa-link]');
  if (waLink) waLink.href = waURL('Buenas, quisiera hacer una consulta.');

  /* ---------------------------------------------------------
     3. FORMULARIOS (validación accesible)
     --------------------------------------------------------- */
  let errId = 0;

  function showError(ctrl, msg) {
    const field = ctrl.closest('.field');
    const err = $('.field__error', field);
    field.classList.add('has-error');
    ctrl.setAttribute('aria-invalid', 'true');
    if (err) {
      err.id ||= `err-${++errId}`;
      err.textContent = msg;
      err.hidden = false;
      ctrl.setAttribute('aria-describedby', err.id);
    }
  }
  function clearError(ctrl) {
    const field = ctrl.closest('.field');
    if (!field?.classList.contains('has-error')) return;
    field.classList.remove('has-error');
    ctrl.removeAttribute('aria-invalid');
    ctrl.removeAttribute('aria-describedby');
    const err = $('.field__error', field);
    if (err) { err.hidden = true; err.textContent = ''; }
  }

  function validate(form) {
    let firstInvalid = null;
    $$('[required]', form).forEach((ctrl) => {
      const value = ctrl.value.trim();
      const tooShort = ctrl.type === 'text' && value.length < 2;
      if (!value || tooShort) {
        showError(ctrl, ctrl.tagName === 'SELECT' ? 'Elegí una opción.' : 'Completá este campo.');
        firstInvalid ||= ctrl;
      } else {
        clearError(ctrl);
      }
    });
    firstInvalid?.focus();
    return !firstInvalid;
  }

  $$('.field input, .field select').forEach((ctrl) => {
    ctrl.addEventListener('input', () => clearError(ctrl));
    ctrl.addEventListener('change', () => clearError(ctrl));
  });

  const bookForm = $('[data-book-form]');
  const serviceSelect = $('[data-service-select]');

  function flashNote(form, text) {
    const note = $('.form__note', form);
    if (!note) return;
    const original = note.dataset.original ||= note.textContent;
    note.textContent = text;
    setTimeout(() => { note.textContent = original; }, 4000);
  }

  bookForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(bookForm)) return;
    const data = new FormData(bookForm);
    openWhatsApp(bookingText({
      name: data.get('nombre').trim(),
      service: data.get('servicio'),
      when: data.get('horario'),
    }));
    flashNote(bookForm, 'Abriendo WhatsApp con tu mensaje…');
  });

  const clubForm = $('[data-club-form]');
  clubForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(clubForm)) return;
    const d = new FormData(clubForm);
    openWhatsApp(
      `Buenas, soy ${d.get('contacto').trim()} de ${d.get('negocio').trim()} (${d.get('categoria')}). ` +
      `Quiero sumar mi negocio al Club ${CLINIC}.`
    );
    flashNote(clubForm, 'Abriendo WhatsApp con tu mensaje…');
  });

  // Tarjetas de servicio: preselecciona el servicio y lleva al formulario
  $$('[data-book]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (serviceSelect) {
        serviceSelect.value = btn.dataset.book;
        clearError(serviceSelect);
      }
      $('#agendar')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      setTimeout(() => $('#b-name')?.focus({ preventScroll: true }), reduceMotion ? 0 : 700);
    });
  });

  /* ---------------------------------------------------------
     4. MÚSICA AMBIENTE (síntesis con Web Audio: sin archivos, sin derechos)
     Pads suaves en progresión Cmaj7 → Am7 → Fmaj7 → G, con campanitas
     pentatónicas esporádicas y reverb sintética.
     --------------------------------------------------------- */
  const Ambient = (() => {
    const CHORDS = [
      [48, 55, 59, 64, 67],   // Cmaj7
      [45, 52, 55, 60, 64],   // Am7
      [41, 48, 57, 60, 64],   // Fmaj7
      [43, 50, 55, 59, 62],   // G
    ];
    const SCALE = [72, 74, 76, 79, 81, 84];   // pentatónica de Do
    const CHORD_SEC = 14;
    const midi = (n) => 440 * 2 ** ((n - 69) / 12);

    let ctx, master, bus, chordTimer, pluckTimer, stopTimer, chord = 0, on = false;

    function impulse(seconds = 4.5, decay = 3) {
      const rate = ctx.sampleRate;
      const len = (rate * seconds) | 0;
      const buf = ctx.createBuffer(2, len, rate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay;
      }
      return buf;
    }

    function init() {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0;

      bus = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1700; lp.Q.value = 0.4;

      // LFO lento sobre el filtro: el timbre "respira"
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.04; lfoGain.gain.value = 500;
      lfo.connect(lfoGain).connect(lp.frequency);
      lfo.start();

      const conv = ctx.createConvolver();
      conv.buffer = impulse();
      const dry = ctx.createGain(); dry.gain.value = 0.55;
      const wet = ctx.createGain(); wet.gain.value = 0.7;

      bus.connect(lp);
      lp.connect(dry).connect(master);
      lp.connect(conv).connect(wet).connect(master);
      master.connect(ctx.destination);
    }

    function pad(freq, t0, dur) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.045, t0 + 4);
      g.gain.linearRampToValueAtTime(0, t0 + dur);

      const a = ctx.createOscillator(); a.type = 'sine'; a.frequency.value = freq;
      const b = ctx.createOscillator(); b.type = 'triangle'; b.frequency.value = freq; b.detune.value = (Math.random() * 2 - 1) * 8;
      const bg = ctx.createGain(); bg.gain.value = 0.35;
      a.connect(g); b.connect(bg).connect(g);

      let out = g;
      if (ctx.createStereoPanner) {
        const p = ctx.createStereoPanner();
        p.pan.value = Math.random() * 1.2 - 0.6;
        g.connect(p); out = p;
      }
      out.connect(bus);
      a.start(t0); b.start(t0);
      a.stop(t0 + dur + 0.1); b.stop(t0 + dur + 0.1);
    }

    function playChord() {
      const t = ctx.currentTime + 0.05;
      CHORDS[chord++ % CHORDS.length].forEach((n, i) => pad(midi(n), t + i * 0.2, CHORD_SEC + 6));
    }

    function pluck() {
      if (!on) return;
      const t = ctx.currentTime;
      const f = midi(SCALE[(Math.random() * SCALE.length) | 0]);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.03, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 5);
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.01;
      const g2 = ctx.createGain(); g2.gain.value = 0.22;
      o1.connect(g); o2.connect(g2).connect(g);
      g.connect(bus);
      o1.start(t); o2.start(t); o1.stop(t + 5.2); o2.stop(t + 5.2);
      pluckTimer = setTimeout(pluck, 3500 + Math.random() * 5000);
    }

    return {
      get on() { return on; },
      async start() {
        if (!ctx) init();
        clearTimeout(stopTimer);
        await ctx.resume();
        on = true;
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setTargetAtTime(0.8, now, 1.4);
        if (!chordTimer) {
          playChord();
          chordTimer = setInterval(playChord, CHORD_SEC * 1000);
          pluckTimer = setTimeout(pluck, 2500);
        }
      },
      stop() {
        if (!ctx) return;
        on = false;
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setTargetAtTime(0, now, 0.5);
        clearInterval(chordTimer); chordTimer = null;
        clearTimeout(pluckTimer);
        stopTimer = setTimeout(() => ctx.suspend(), 2500);
      },
      pause() { if (ctx && on) ctx.suspend(); },
      resume() { if (ctx && on) ctx.resume(); },
    };
  })();

  const soundBtn = $('[data-sound-toggle]');

  function renderSound() {
    const on = Ambient.on;
    soundBtn?.setAttribute('aria-pressed', String(on));
    soundBtn?.setAttribute('aria-label', on ? 'Silenciar música ambiente' : 'Activar música ambiente');
  }

  async function setSound(on) {
    try { on ? await Ambient.start() : Ambient.stop(); } catch { /* audio no disponible */ }
    renderSound();
  }

  soundBtn?.addEventListener('click', () => setSound(!Ambient.on));

  // Ahorra batería: pausa el audio con la pestaña oculta
  document.addEventListener('visibilitychange', () => (document.hidden ? Ambient.pause() : Ambient.resume()));

  /* ---------------------------------------------------------
     5. BIENVENIDA (gesto del usuario = permiso de audio)
     --------------------------------------------------------- */
  const welcome = $('[data-welcome]');

  if (welcome) {
    const accept = $('[data-welcome-accept]', welcome);
    const decline = $('[data-welcome-decline]', welcome);

    const close = (withSound) => {
      welcome.classList.add('is-hidden');
      welcome.setAttribute('inert', '');
      body.classList.remove('is-locked');
      storage.set('godula-welcomed', '1', 'sessionStorage');
      if (withSound) setSound(true);
    };

    if (storage.get('godula-welcomed', 'sessionStorage')) {
      welcome.style.transition = 'none';
      close(false);
    } else {
      body.classList.add('is-locked');
      accept?.focus({ preventScroll: true });
      accept?.addEventListener('click', () => close(true));
      decline?.addEventListener('click', () => close(false));
      welcome.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') return close(false);
        if (e.key !== 'Tab') return;
        const first = accept, last = decline;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    }
  }

  /* ---------------------------------------------------------
     6. HEADER + NAV
     --------------------------------------------------------- */
  const header = $('[data-header]');
  const nav = $('[data-nav]');
  const navToggle = $('[data-nav-toggle]');
  const desktop = matchMedia('(min-width: 62rem)');

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header?.classList.toggle('is-scrolled', window.scrollY > 24);
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setNav(open) {
    nav?.classList.toggle('is-open', open);
    navToggle?.setAttribute('aria-expanded', String(open));
    navToggle?.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    body.classList.toggle('is-locked', open);
  }

  navToggle?.addEventListener('click', () => setNav(navToggle.getAttribute('aria-expanded') !== 'true'));
  nav?.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navToggle?.getAttribute('aria-expanded') === 'true') { setNav(false); navToggle.focus(); }
  });
  desktop.addEventListener('change', (e) => { if (e.matches) setNav(false); });

  // Enlace activo según la sección visible
  const navLinks = $$('.nav__list a[href^="#"]:not(.nav__cta)');
  if ('IntersectionObserver' in window && navLinks.length) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.removeAttribute('aria-current'));
        byId.get(entry.target.id)?.setAttribute('aria-current', 'location');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------------------------------------------------------
     7. REVEAL AL HACER SCROLL (escalonado por grupo)
     --------------------------------------------------------- */
  const revealEls = $$('[data-reveal]');

  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const groups = new Map();
    revealEls.forEach((el) => {
      const i = groups.get(el.parentElement) ?? 0;
      groups.set(el.parentElement, i + 1);
      el.style.setProperty('--d', `${Math.min(i, 6) * 80}ms`);
    });
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------
     8. TILT EN TARJETAS + PARALLAX DE ORBES (solo puntero fino)
     --------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach((card) => {
      let raf = 0;
      card.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          card.style.setProperty('--rx', `${((0.5 - y) * 5).toFixed(2)}deg`);
          card.style.setProperty('--ry', `${((x - 0.5) * 7).toFixed(2)}deg`);
          card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
          card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
        });
      });
      card.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf);
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });

    let praf = 0;
    addEventListener('pointermove', (e) => {
      cancelAnimationFrame(praf);
      praf = requestAnimationFrame(() => {
        root.style.setProperty('--px', ((e.clientX / innerWidth) * 2 - 1).toFixed(3));
        root.style.setProperty('--py', ((e.clientY / innerHeight) * 2 - 1).toFixed(3));
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     9. EXTRAS
     --------------------------------------------------------- */
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
