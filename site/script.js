/**
 * SiteForge — interactions
 * Preloader with % counter, hero parallax, project overlay,
 * click-to-copy email, service toggles, reveals, mobile nav, form.
 */
(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const mql = (q) => { try { return window.matchMedia(q).matches; } catch (e) { return false; } };
  const isCoarse = mql('(pointer: coarse)');
  const reduceMotion = mql('(prefers-reduced-motion: reduce)');

  /* ---------- Preloader with percentage ---------- */
  const loader = $('#loader');
  const loaderCount = $('#loaderCount');
  let progress = 0;
  let progressTimer = null;
  let loaderDone = false;

  const finishLoader = () => {
    if (loaderDone) return;
    loaderDone = true;
    if (progressTimer) clearInterval(progressTimer);
    const snap = () => {
      if (loaderCount) loaderCount.textContent = '100%';
      loader.classList.add('is-done');
      document.body.classList.add('loaded');
      setTimeout(() => { loader.style.display = 'none'; }, 1000);
    };
    // brief hold at 100% so the number is readable
    setTimeout(snap, reduceMotion ? 0 : 250);
  };

  if (loader && loaderCount) {
    progressTimer = setInterval(() => {
      // ease toward 90% while assets load, hold there if needed
      const target = document.readyState === 'complete' ? 100 : 90;
      progress = Math.min(target, progress + Math.max(1, Math.round((target - progress) * 0.18)));
      loaderCount.textContent = progress + '%';
      if (progress >= 100) finishLoader();
    }, reduceMotion ? 20 : 40);
    window.addEventListener('load', () => {
      // let the counter reach 100 on the next tick(s)
      setTimeout(() => { if (!loaderDone) { progress = 99; } }, 350);
      setTimeout(finishLoader, 900);
    });
    // absolute fallback so nobody ever stares at the loader
    setTimeout(finishLoader, 4000);
  } else {
    document.body.classList.add('loaded');
  }

  /* ---------- Nav: scrolled state ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const navToggle = $('#navToggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('menu-open');
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('no-scroll', open);
    });
    $$('.nav-link').forEach(link =>
      link.addEventListener('click', () => {
        nav.classList.remove('menu-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
      })
    );
  }

  /* ---------- Smooth anchor scroll with nav offset ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navH * 0.5;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Hero floating-card parallax (perf-tuned) ---------- */
  const parallaxEls = $$('.parallax');
  if (parallaxEls.length && !isCoarse && !reduceMotion) {
    // cache depth & tilt once — no per-frame DOM/style reads
    const items = parallaxEls.map(el => ({
      el,
      depth: parseFloat(el.dataset.depth || '20'),
      rot: (getComputedStyle(el).getPropertyValue('--rot') || '0deg').trim() || '0deg'
    }));
    const hero = $('.hero');
    let heroVisible = true;
    let mx = 0, my = 0, cx = 0, cy = 0, raf = null;

    const paint = () => {
      for (const it of items) {
        it.el.style.transform =
          'translate3d(' + (cx * it.depth).toFixed(2) + 'px, ' + (cy * it.depth).toFixed(2) + 'px, 0) rotate(' + it.rot + ')';
      }
    };
    const tick = () => {
      raf = null;
      if (!heroVisible) return;
      cx += (mx - cx) * 0.06;
      cy += (my - cy) * 0.06;
      paint();
      if (Math.abs(mx - cx) < 0.0004 && Math.abs(my - cy) < 0.0004) {
        cx = mx; cy = my;
        paint(); // snap exactly to rest, then stop looping — zero cost while idle
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (raf === null && heroVisible) raf = requestAnimationFrame(tick);
    };
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible) kick(); // resume when the hero scrolls back into view
      }, { threshold: 0 }).observe(hero);
    }
    window.addEventListener('mousemove', (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
      kick();
    }, { passive: true });
    kick();
  }

  /* ---------- Proximity glow on hero title letters ---------- */
  const heroTitle = $('.hero-title');
  if (heroTitle && !isCoarse && !reduceMotion) {
    const chars = $$('.ht-char', heroTitle).map(el => ({ el, x: 0, y: 0, g: 0, prev: '' }));
    const R = 230; // glow falloff radius in px
    const hero = $('.hero');
    let mx = -9999, my = -9999;      // raw cursor
    let lx = -9999, ly = -9999;      // lerped "light" position
    let seen = false;
    let rectsDirty = true;
    let heroVisible = true;
    let raf = null;

    const readRects = () => {
      for (const c of chars) {
        const r = c.el.getBoundingClientRect();
        c.x = r.left + r.width / 2;
        c.y = r.top + r.height / 2;
      }
      rectsDirty = false;
    };

    // smoothstep falloff: 0 at R, 1 at the cursor, soft at both ends
    const influence = (c) => {
      const dx = c.x - lx, dy = c.y - ly;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d >= R) return 0;
      const t = 1 - d / R;
      return t * t * (3 - 2 * t);
    };

    const tick = () => {
      raf = null;
      if (!heroVisible || !seen) return;
      if (rectsDirty) readRects();
      lx += (mx - lx) * 0.18; // light position lags the cursor slightly -> smooth sweep
      ly += (my - ly) * 0.18;
      let live = 0;
      for (const c of chars) {
        const target = influence(c);
        c.g += (target - c.g) * 0.16; // per-letter intensity lerp: no jumps
        if (c.g < 0.0015 && target === 0) c.g = 0;
        if (c.g > 0) live++;
        const next = c.g.toFixed(3);
        if (next !== c.prev) {
          c.el.style.setProperty('--glow', next);
          c.prev = next;
        }
      }
      // keep animating while light moves or letters fade; sleep when still
      if (live > 0 || Math.abs(mx - lx) > 0.5 || Math.abs(my - ly) > 0.5) {
        raf = requestAnimationFrame(tick);
      }
    };
    const kick = () => { if (raf === null && heroVisible && seen) raf = requestAnimationFrame(tick); };

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!seen) { lx = mx; ly = my; seen = true; }
      kick();
    }, { passive: true });

    window.addEventListener('scroll', () => { rectsDirty = true; kick(); }, { passive: true });
    window.addEventListener('resize', () => { rectsDirty = true; kick(); }, { passive: true });

    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible) kick();
      }, { threshold: 0 }).observe(hero);
    }
  }

  /* ---------- Project overlay ---------- */
  const PROJECTS = {
    nova: {
      num: '01',
      title: 'Nova Architecture',
      type: 'Architecture — Website Concept',
      text: 'A SiteForge concept exploring how an architecture studio could present itself online — full-bleed monochrome project imagery, case-study layouts and a calm, confident enquiry flow. Designed to show the level of website your studio could have.'
    },
    form: {
      num: '02',
      title: 'Form Furniture',
      type: 'Furniture — Website Concept',
      text: 'A SiteForge concept for a furniture maker\u2019s online store — editorial product pages, a lightning-fast catalogue and a nearly frictionless checkout path, composed to feel like flipping through a printed lookbook. Yours could work the same way.'
    },
    saffron: {
      num: '03',
      title: 'Saffron & Salt',
      type: 'Restaurant — Website Concept',
      text: 'A SiteForge concept for a restaurant that wants photography to do the selling — moody imagery, a menu that updates in minutes, reservations linked up and directions one tap away. Imagine it dressed in your brand instead.'
    }
  };

  const overlay = $('#projectOverlay');
  const openProject = (key) => {
    const p = PROJECTS[key];
    if (!p || !overlay) return;
    $('#ovNum').textContent = p.num;
    $('#ovTitle').textContent = p.title;
    $('#ovType').textContent = p.type;
    $('#ovText').textContent = p.text;
    overlay.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    $$('.index-item').forEach(btn => btn.classList.toggle('is-active', btn.dataset.project === key));
  };
  const closeOverlay = () => {
    if (!overlay || overlay.hidden) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    $$('.index-item').forEach(btn => btn.classList.remove('is-active'));
    setTimeout(() => { overlay.hidden = true; }, 350);
  };
  $$('[data-project]').forEach(el => {
    el.addEventListener('click', () => openProject(el.dataset.project));
  });
  if (overlay) {
    $$('[data-close-overlay]', overlay).forEach(el => el.addEventListener('click', closeOverlay));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlay(); });
  }

  /* ---------- Click-to-copy email ---------- */
  const copyBtn = $('#copyEmail');
  const copyNote = $('#copyNote');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email || 'email@example.com';
      let ok = false;
      try {
        await navigator.clipboard.writeText(email);
        ok = true;
      } catch (err) {
        try {
          const ta = document.createElement('textarea');
          ta.value = email;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          ok = document.execCommand('copy');
          document.body.removeChild(ta);
        } catch (err2) { ok = false; }
      }
      if (copyNote) {
        copyNote.textContent = ok ? 'Email copied!' : 'Copy failed — select it manually';
        setTimeout(() => { copyNote.textContent = ''; }, 2200);
      }
    });
  }

  /* ---------- Service card "Learn more" expand/collapse ---------- */
  const setCard = (card, open) => {
    card.classList.toggle('open', open);
    const btn = $('.card-toggle', card);
    const label = btn ? $('.card-toggle-label', btn) : null;
    if (btn) btn.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Close' : 'Learn more';
  };
  $$('.card-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.service-card');
      if (!card) return;
      const wasOpen = card.classList.contains('open');
      $$('.service-card.open').forEach(other => { if (other !== card) setCard(other, false); });
      setCard(card, !wasOpen);
    });
  });

  /* ---------- Magnetic buttons (subtle) ---------- */
  $$('.btn').forEach(btn => {
    if (isCoarse || reduceMotion) return;
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = 'translate(' + (x * 0.1).toFixed(2) + 'px, ' + (y * 0.16).toFixed(2) + 'px)';
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });

  /* ---------- Contact form (client-side handling only) ---------- */
  const form = $('#contactForm');
  const note = $('#formNote');
  const submitText = $('#submitText');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const required = $$('input[required], select[required], textarea[required]', form);
      let firstInvalid = null;
      required.forEach(input => {
        const bad = !input.value.trim() ||
          (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value));
        input.classList.toggle('is-error', bad);
        if (bad && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      // Simulated success. To send by email/WhatsApp/Sheets, hook this up to a backend or service.
      const data = Object.fromEntries(new FormData(form).entries());
      console.log('Contact form submission:', data);
      submitText.textContent = 'SENT ✓';
      note.textContent = "Thanks — I'll be in touch within a few hours.";
      note.classList.add('success');
      form.reset();
      setTimeout(() => { submitText.textContent = 'SEND REQUEST'; }, 4000);
    });

    $$('input, select, textarea', form).forEach(input => {
      input.addEventListener('input', () => input.classList.remove('is-error'));
    });
  }

  /* ---------- Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
