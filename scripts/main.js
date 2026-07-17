// Portfolio interactions: mobile nav, scroll-revealed sections, stat counters,
// and the Formspree contact form. Vanilla JS, no deps.

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    setFooterYear();
    wireNavToggle();
    revealSectionsOnScroll();
    animateCounters();
    wireContactForm();
  });

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
