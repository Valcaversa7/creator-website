/* =================================================================
   STUDIO — Interactions
   ================================================================= */

(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Page loader ---------- */
  window.addEventListener('load', () => {
    const loader = $('#loader');
    if (!loader) return;
    // minimum visible time so the animation feels intentional
    setTimeout(() => loader.classList.add('is-done'), 650);
  });

  /* ---------- Year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav: scroll state + mobile toggle ---------- */
  const nav = $('#nav');
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');

  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    // Close mobile menu when a link is clicked
    $$('a', navLinks).forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Smooth anchor scrolling (offset for sticky nav) ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navH + 1;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ---------- Active section highlighting in nav ---------- */
  const sections = $$('main section[id]');
  const navItems = $$('.nav-link');
  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navItems.forEach(n => n.classList.toggle('is-active', n.getAttribute('href') === '#' + id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(s => navObserver.observe(s));
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // small stagger for groups
          const el = entry.target;
          const delay = (el.dataset.delay || 0);
          setTimeout(() => el.classList.add('is-visible'), delay);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    // group siblings inside a parent for staggered reveal
    const grouped = new Set();
    revealEls.forEach((el, idx) => {
      const parent = el.parentElement;
      if (parent && !grouped.has(parent)) {
        grouped.add(parent);
        const kids = Array.from(parent.querySelectorAll(':scope > .reveal'));
        kids.forEach((kid, i) => {
          if (!kid.dataset.delay) kid.dataset.delay = String(i * 80);
        });
      }
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Subtle parallax (data-parallax in px) ---------- */
  const parallaxEls = $$('[data-parallax]');
  let ticking = false;
  const updateParallax = () => {
    parallaxEls.forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0;
      const rect = el.getBoundingClientRect();
      const inView = rect.bottom > -200 && rect.top < window.innerHeight + 200;
      if (inView) {
        const offset = (window.innerHeight / 2 - (rect.top + rect.height / 2)) / window.innerHeight * speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      }
    });
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
  updateParallax();

  /* ---------- Custom cursor (desktop) ---------- */
  const cursorDot = $('.cursor-dot');
  const cursorRing = $('.cursor-ring');
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  if (cursorDot && cursorRing && !isCoarse) {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    const move = (e) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', move);

    const render = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      cursorDot.style.transform = `translate3d(${mx - 3}px, ${my - 3}px, 0)`;
      cursorRing.style.transform = `translate3d(${rx - 19}px, ${ry - 19}px, 0)`;
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    // hover state for interactive elements
    const interactiveSel = 'a, button, input, select, textarea, .service-card, .price-card, .work-card, [data-cursor]';
    $$(interactiveSel).forEach(el => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('is-hover'));
    });

    // hide when leaving window
    document.addEventListener('mouseleave', () => {
      cursorDot.style.opacity = '0';
      cursorRing.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      cursorDot.style.opacity = '1';
      cursorRing.style.opacity = '1';
    });
  }

  /* ---------- Subtle 3D tilt on work cards ---------- */
  $$('.work-card').forEach(card => {
    const preview = $('.work-preview', card);
    if (!preview) return;
    card.addEventListener('mousemove', (e) => {
      if (isCoarse) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      preview.style.transform = `translateY(-6px) perspective(900px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 3).toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      preview.style.transform = '';
    });
  });

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
      // close any other open card so only one expands at a time
      $$('.service-card.open').forEach(other => { if (other !== card) setCard(other, false); });
      setCard(card, !wasOpen);
    });
  });

  /* ---------- Magnetic buttons (subtle) ---------- */
  $$('.btn').forEach(btn => {
    if (isCoarse) return;
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  /* ---------- Contact form (client-side handling only) ---------- */
  const form = $('#contactForm');
  const note = $('#formNote');
  const submitText = $('#submitText');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // simple required validation
      const required = $$('[required]', form);
      let firstInvalid = null;
      required.forEach(input => {
        const ok = input.value.trim().length > 0 && (input.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
        input.classList.toggle('is-error', !ok);
        if (!ok && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        note.textContent = 'Please fill in the highlighted fields.';
        note.classList.remove('success');
        firstInvalid.focus();
        return;
      }
      // Simulated success. To send by email/WhatsApp/Sheets, hook this up to a backend or service.
      const data = Object.fromEntries(new FormData(form).entries());
      console.log('Contact form submission:', data);
      submitText.textContent = 'SENT ✓';
      note.textContent = 'Thanks — I\'ll be in touch within a few hours.';
      note.classList.add('success');
      form.reset();
      setTimeout(() => { submitText.textContent = 'SEND REQUEST'; }, 4000);
    });

    // clear error on input
    $$('input, select, textarea', form).forEach(input => {
      input.addEventListener('input', () => input.classList.remove('is-error'));
    });
  }

})();
