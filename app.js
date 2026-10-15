/*
 * Gódula — app.js
 * Guardar junto a index.html y styles.css. JavaScript nativo, sin dependencias.
 * WhatsApp prepara mensajes; el visitante decide enviarlos y la clínica confirma la cita.
 * Los códigos 100–999 son referencias aleatorias: pueden repetirse y no validan descuentos.
 * El ambiente instrumental se sintetiza localmente con Web Audio, sin archivos ni autoplay.
 */
(() => {
  'use strict';

  const PHONE = '595987302505';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const notice = document.createElement('p');
  notice.className = 'sr-only';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  document.body.append(notice);
  const announce = (message) => { notice.textContent = message; };

  function randomCode() {
    // Rejection sampling evita el sesgo del módulo: 65.536 no es múltiplo de 900.
    if (window.crypto?.getRandomValues) {
      const value = new Uint16Array(1);
      do { window.crypto.getRandomValues(value); } while (value[0] >= 64800);
      return String(100 + value[0] % 900);
    }
    return String(100 + Math.floor(Math.random() * 900));
  }

  function whatsappURL(message) {
    return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
  }

  function bonusMessage() {
    const service = $('#service')?.value || 'Quiero asesoramiento';
    return [
      'Buenas, deseo agendar un servicio estético con el bonus de la página web.',
      `Servicio de interés: ${service}.`,
      `Código web: ${randomCode()}.`,
      '¿Me confirman el descuento aplicable y los horarios disponibles?'
    ].join('\n');
  }

  // La navegación en la misma pestaña evita bloqueos de ventanas emergentes.
  // En dispositivos móviles, WhatsApp puede abrir su aplicación directamente.
  function openWhatsApp(message) {
    window.location.assign(whatsappURL(message));
  }

  $('#booking-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const message = bonusMessage();
    announce('Abriendo WhatsApp con tu consulta y código web.');
    openWhatsApp(message);
  });

  $$('[data-bonus]').forEach((link) => {
    const prepare = () => { link.href = whatsappURL(bonusMessage()); };
    prepare(); // Incluye el código incluso al copiar el enlace o abrirlo desde el menú contextual.
    link.addEventListener('click', prepare);
    link.addEventListener('auxclick', prepare);
    link.addEventListener('contextmenu', prepare);
  });

  $$('[data-select]').forEach((link) => {
    link.addEventListener('click', () => {
      const select = $('#service');
      if (!select) return;
      const value = link.dataset.select;
      if ([...select.options].some((option) => option.value === value)) {
        select.value = value;
        announce(`Seleccionaste ${value}. Continuá con tu consulta por WhatsApp.`);
      }
      // Se conserva la navegación nativa a #agendar, incluida su URL accesible.
    });
  });

  // Tratamientos: el contenido ya está en el HTML y sigue disponible sin JavaScript.
  const filters = $$('[data-filter]');
  const cards = $$('.service-card[data-category]');
  filters.forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.filter;
      filters.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      let count = 0;
      cards.forEach((card) => {
        card.hidden = category !== 'all' && card.dataset.category !== category;
        if (!card.hidden) count++;
      });
      const status = $('#filter-status');
      if (status) status.textContent = `${count} tratamientos disponibles en esta categoría.`;
    });
  });

  // Menú móvil: Escape y clic fuera cierran el menú; foco visible gestionado por CSS.
  const menuButton = $('.menu');
  const nav = $('#nav');
  const mobile = window.matchMedia('(max-width: 700px)');
  function setMenu(open, restoreFocus = false) {
    if (!menuButton || !nav) return;
    nav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menuButton.textContent = open ? '×' : '☰';
    if (restoreFocus) menuButton.focus();
  }
  menuButton?.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  nav?.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('click', (event) => {
    if (nav?.classList.contains('open') && !nav.contains(event.target) && !menuButton?.contains(event.target)) {
      setMenu(false);
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav?.classList.contains('open')) setMenu(false, true);
  });
  mobile.addEventListener('change', () => setMenu(false));

  // Tema: primero la preferencia guardada; luego el tema del sistema.
  const themeButton = $('#theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  let chosenTheme = null;
  try { chosenTheme = localStorage.getItem('godula-theme'); } catch { /* Almacenamiento opcional. */ }
  if (!['light', 'dark'].includes(chosenTheme)) chosenTheme = null;
  function applyTheme(dark) {
    document.body.classList.toggle('dark', dark);
    themeButton?.setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
    themeButton?.setAttribute('aria-pressed', String(dark));
    const meta = $('meta[name="theme-color"]');
    meta?.setAttribute('content', dark ? '#241e1c' : '#F9F6F0');
  }
  applyTheme(chosenTheme ? chosenTheme === 'dark' : systemDark.matches);
  themeButton?.addEventListener('click', () => {
    const dark = !document.body.classList.contains('dark');
    chosenTheme = dark ? 'dark' : 'light';
    applyTheme(dark);
    try { localStorage.setItem('godula-theme', chosenTheme); } catch { /* No bloquea el tema. */ }
  });
  systemDark.addEventListener('change', (event) => {
    if (!chosenTheme) applyTheme(event.matches);
  });

  // Club: modal nativo con foco contenido y cierre por Escape incorporados.
  const club = $('#club-dialog');
  const clubOpen = $('#club-open');
  clubOpen?.addEventListener('click', () => {
    if (typeof club?.showModal === 'function') {
      if (!club.open) club.showModal();
    } else {
      openWhatsApp('Buenas, quiero conocer cómo adherir mi negocio wellness al Club Gódula.');
    }
  });
  club?.querySelector('.close')?.addEventListener('click', () => club.close());
  club?.addEventListener('close', () => clubOpen?.focus());
  club?.addEventListener('click', (event) => {
    if (event.target !== club) return;
    const rect = club.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      club.close();
    }
  });
  $('#club-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const business = $('#business');
    const contact = $('#contact');
    for (const input of [business, contact]) {
      if (!input) return;
      input.value = input.value.trim();
    }
    if (!event.currentTarget.reportValidity()) return;
    const message = [
      'Buenas, quiero solicitar la adhesión de mi negocio al Club Gódula.',
      `Negocio: ${business.value}`,
      `Categoría: ${$('#category')?.value || 'Wellness'}`,
      `Mi nombre: ${contact.value}`,
      '¿Podemos conversar sobre las condiciones y los beneficios para aliados?'
    ].join('\n');
    openWhatsApp(message);
  });

  // Reveal progresivo, de una sola ejecución. No oculta contenido sin soporte.
  if ('IntersectionObserver' in window && !motion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    $$('.reveal').forEach((element) => observer.observe(element));
    document.body.classList.add('motion-ready');
    motion.addEventListener('change', (event) => {
      if (event.matches) {
        document.body.classList.remove('motion-ready');
        observer.disconnect();
      }
    });
  }

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Ambiente original: arpegios suaves y acordes sostenidos, sin descarga de audio.
  // Volumen conservador, inicio por clic y pausa al salir de la pestaña.
  const soundButton = $('#sound');
  const soundLabel = $('#sound-label');
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let context = null;
  let master = null;
  let compressor = null;
  let playing = false;
  let busy = false;
  let timer = null;
  let nextNote = 0;
  let beat = 0;
  const voices = new Set();
  const chords = [
    [48, 55, 59, 64], // Cmaj7
    [45, 52, 55, 60], // Am7
    [41, 48, 52, 57], // Fmaj7
    [43, 50, 55, 57]  // Gsus2
  ];
  const pattern = [0, 2, 1, 3, 2, 1, 3, 2];
  const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);

  function updateSoundUI() {
    soundButton?.setAttribute('aria-pressed', String(playing));
    soundButton?.setAttribute('title', playing ? 'Pausar ambiente sonoro' : 'Activar ambiente sonoro');
    if (soundLabel) soundLabel.textContent = playing ? 'Pausar calma' : 'Activar calma';
  }

  function tone(midi, when, duration, volume, sustained = false) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency(midi);
    const attack = sustained ? 1.6 : 0.045;
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(volume, when + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    voices.add(oscillator);
    oscillator.onended = () => {
      voices.delete(oscillator);
      oscillator.disconnect();
      envelope.disconnect();
    };
    oscillator.start(when);
    oscillator.stop(when + duration + 0.05);
  }

  function schedule() {
    if (!playing || context.state !== 'running') return;
    // Evita ráfagas de notas si el navegador estuvo ocupado.
    if (nextNote < context.currentTime - 0.2) nextNote = context.currentTime + 0.05;
    while (nextNote < context.currentTime + 0.35) {
      const chord = chords[Math.floor(beat / 8) % chords.length];
      tone(chord[pattern[beat % 8]] + 12, nextNote, 3.8, 0.13);
      if (beat % 8 === 0) chord.forEach((note) => tone(note, nextNote, 8.5, 0.055, true));
      nextNote += 1.15;
      beat++;
    }
  }

  function stopAudio() {
    playing = false;
    clearInterval(timer);
    timer = null;
    if (context && master) {
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(0, now, 0.08);
      voices.forEach((voice) => {
        try { voice.stop(now + 0.4); } catch { /* Puede haber terminado naturalmente. */ }
      });
      // Cierra el contexto tras el fade para liberar recursos, también en segundo plano.
      const oldContext = context;
      setTimeout(() => { oldContext.close().catch(() => {}); }, 500);
      context = null;
      master = null;
      compressor = null;
    }
    updateSoundUI();
  }

  soundButton?.addEventListener('click', async () => {
    if (busy) return;
    if (playing) { stopAudio(); return; }
    if (!AudioContextClass) {
      announce('Este navegador no permite reproducir el ambiente sonoro.');
      return;
    }
    busy = true;
    try {
      context = new AudioContextClass();
      master = context.createGain();
      compressor = context.createDynamicsCompressor();
      master.gain.value = 0;
      master.connect(compressor);
      compressor.connect(context.destination);
      await context.resume();
      if (document.hidden || context.state !== 'running') { stopAudio(); return; }
      playing = true;
      beat = 0;
      nextNote = context.currentTime + 0.08;
      master.gain.linearRampToValueAtTime(0.22, context.currentTime + 1.5);
      schedule();
      timer = setInterval(schedule, 150);
      updateSoundUI();
    } catch {
      stopAudio();
      announce('No pudimos activar el sonido. Podés volver a intentarlo.');
    } finally {
      busy = false;
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) stopAudio();
  });
  window.addEventListener('pagehide', stopAudio);
  updateSoundUI();
})();
