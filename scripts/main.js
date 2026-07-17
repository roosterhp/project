// Portfolio interactions: mobile nav, scroll-revealed sections, stat counters,
// and the Formspree contact form. Vanilla JS, no deps.

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    setFooterYear();
    wireNavToggle();
    wireCaseCards();
    startBackgroundNetwork();
    revealSectionsOnScroll();
    animateCounters();
    wireContactForm();
  });

  // Experience cards: collapsed to company/role/dates; header click expands
  // details. The .collapsible class gates the CSS so no-JS users see all
  // content expanded.
  function wireCaseCards() {
    document.querySelectorAll('.case-card').forEach((card) => {
      const toggle = card.querySelector('.case-head');
      if (!toggle) return;
      card.classList.add('collapsible');
      toggle.addEventListener('click', () => {
        const isOpen = card.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(isOpen));
      });
    });
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setFooterYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }

  // Mobile nav toggle: hamburger open/close + close on link click, outside click, Escape.
  function wireNavToggle() {
    const toggle = document.querySelector('.menu-toggle');
    const header = document.querySelector('.site-header');
    if (!toggle || !header) return;

    const close = () => {
      header.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    header.querySelectorAll('.site-nav a').forEach((link) => {
      link.addEventListener('click', close);
    });

    document.addEventListener('click', (e) => {
      if (!header.contains(e.target) && header.classList.contains('nav-open')) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) {
        close();
        toggle.focus();
      }
    });
  }

  // Fade sections up as they enter the viewport. The .reveal class is added
  // here (not in the HTML) so users without JS always see the content.
  function revealSectionsOnScroll() {
    const sections = document.querySelectorAll('.section');
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

    sections.forEach((s) => s.classList.add('reveal'));
    // threshold 0 + negative bottom margin: fires as soon as a section edge is
    // ~80px into the viewport. A fractional threshold would never fire for
    // sections taller than the viewport (e.g. Experience on mobile).
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -80px 0px' }
    );
    sections.forEach((s) => io.observe(s));
  }

  // Animate numbers with data-count from 0 -> target when they enter view.
  function animateCounters() {
    const values = document.querySelectorAll('[data-count]');
    if (values.length === 0) return;

    // Markup already contains the final text, so with reduced motion or no
    // IntersectionObserver there is nothing to do.
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            countUp(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    values.forEach((v) => io.observe(v));
  }

  function countUp(el) {
    const target = parseInt(el.dataset.count || '0', 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1100;
    const start = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(frame);
  }

  // Animated canvas network — drifting nodes connected by lines (cluster vibe).
  // Skipped entirely under prefers-reduced-motion.
  function startBackgroundNetwork() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || prefersReducedMotion()) return;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0, height = 0;
    let nodes = [];
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn();
    }

    function spawn() {
      const area = width * height;
      const count = Math.max(28, Math.min(80, Math.floor(area / 22000)));
      nodes = new Array(count).fill(0).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1.2 + Math.random() * 1.6,
      }));
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width)  n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        // gentle repulsion around the pointer so the field feels alive
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const md = dx * dx + dy * dy;
        if (md < 140 * 140) {
          const f = (140 - Math.sqrt(md)) / 140;
          n.x += (dx / Math.sqrt(md || 1)) * f * 0.8;
          n.y += (dy / Math.sqrt(md || 1)) * f * 0.8;
        }
      }

      const maxDist = 130;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) {
            const alpha = (1 - d / maxDist) * 0.35;
            ctx.strokeStyle = `rgba(88,166,255,${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.fillStyle = 'rgba(121,192,255,0.85)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(step);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('pointerleave', () => { mouse.x = -9999; mouse.y = -9999; });

    resize();
    requestAnimationFrame(step);
  }

  // Contact form: POST to Formspree via fetch, with English validation messages.
  function wireContactForm() {
    const form = document.getElementById('contact-form');
    const hint = document.getElementById('form-hint');
    if (!form) return;

    // Force English validation messages (override browser locale e.g. Vietnamese).
    const messagesByName = {
      firstName: 'Please enter your first name.',
      lastName:  'Please enter your last name.',
      email:     'Please enter a valid email address.',
      role:      'Please select your role.',
      message:   'Please write a short message.',
    };
    form.querySelectorAll('input, select, textarea').forEach((el) => {
      el.addEventListener('invalid', () => {
        if (el.validity.valid) { el.setCustomValidity(''); return; }
        if (el.validity.valueMissing) {
          el.setCustomValidity(messagesByName[el.name] || 'This field is required.');
        } else if (el.validity.typeMismatch && el.type === 'email') {
          el.setCustomValidity('Please enter a valid email address.');
        } else if (el.validity.typeMismatch && el.type === 'tel') {
          el.setCustomValidity('Please enter a valid phone number.');
        } else {
          el.setCustomValidity('Please check this field.');
        }
      });
      el.addEventListener('input',  () => el.setCustomValidity(''));
      el.addEventListener('change', () => el.setCustomValidity(''));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        if (hint) { hint.textContent = 'please fill the required fields'; hint.className = 'form-hint error'; }
        return;
      }

      const submitBtn = form.querySelector('.btn-send');
      const originalLabel = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Sending…'; }
      if (hint) { hint.textContent = 'sending your message…'; hint.className = 'form-hint'; }

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('formspree responded ' + res.status);
        form.reset();
        if (hint) { hint.textContent = '✓ message sent — talk soon!'; hint.className = 'form-hint success'; }
      } catch (err) {
        if (hint) { hint.textContent = '✗ failed to send — try mailing hophuoc.work@gmail.com directly'; hint.className = 'form-hint error'; }
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalLabel; }
      }
    });

    // clear error state when user edits any field again
    form.addEventListener('input', () => {
      if (hint && hint.classList.contains('error')) {
        hint.textContent = 'delivered straight to my inbox';
        hint.className = 'form-hint';
      }
    });
  }

})();
