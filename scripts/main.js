// Portfolio interactions: typed prompts, scroll-revealed stages, metric counters,
// and a small "run status" lifecycle. Vanilla JS, no deps.

(function () {
  'use strict';

  // On reload/direct-load with a #stage-* hash, strip the hash, jump to top,
  // and let the pipeline intro play from the start (so refresh always = clean load).
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  window.scrollTo(0, 0);

  document.addEventListener('DOMContentLoaded', async () => {
    window.scrollTo(0, 0);
    setFooterYear();
    wireNavToggle();
    startBackgroundNetwork();
    await runPipelineIntro();
    // small pause so the "✓ pipeline complete" frame is visible while still big
    await wait(300);
    document.body.classList.remove('booting');
    // give layout transitions a moment before kicking off scroll/typing animations
    await wait(350);
    typeCommands();
    revealStagesOnScroll();
    animateCounters();
    wireContactForm();
    wireLogoToTop();
    wireExpTimeline();
  });

  // Mobile nav toggle: hamburger open/close + close-on-outside-click.
  function wireNavToggle() {
    const toggle = document.querySelector('.menu-toggle');
    const topbar = document.querySelector('.topbar');
    if (!toggle || !topbar) return;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = topbar.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    topbar.querySelectorAll('.topbar-nav a').forEach((link) => {
      link.addEventListener('click', () => {
        topbar.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (e) => {
      if (!topbar.contains(e.target) && topbar.classList.contains('nav-open')) {
        topbar.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && topbar.classList.contains('nav-open')) {
        topbar.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // Logo click: smooth-scroll to top without leaving "#" in the URL.
  function wireExpTimeline() {
    document.querySelectorAll('.exp-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const entry = btn.closest('.exp-entry');
        const isOpen = entry.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
      });
    });
  }

  function wireLogoToTop() {
    const logo = document.getElementById('logo-top');
    if (!logo) return;
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      history.replaceState(null, '', window.location.pathname + window.location.search);
    });
  }

  // Contact form: build a mailto link with all field values, open the user's mail client.
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
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach((el) => {
      const setMsg = () => {
        if (el.validity.valid) { el.setCustomValidity(''); return; }
        if (el.validity.valueMissing) {
          el.setCustomValidity(messagesByName[el.name] || 'This field is required.');
        } else if (el.validity.typeMismatch && el.type === 'email') {
          el.setCustomValidity('Please enter a valid email address.');
        } else if (el.validity.typeMismatch && el.type === 'tel') {
          el.setCustomValidity('Please enter a valid phone number.');
        } else if (el.validity.tooShort) {
          el.setCustomValidity(`Please use at least ${el.minLength} characters.`);
        } else if (el.validity.patternMismatch) {
          el.setCustomValidity('Please match the requested format.');
        } else {
          el.setCustomValidity('Please check this field.');
        }
      };
      el.addEventListener('invalid', setMsg);
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

    // clear hint state when user edits any field again
    form.addEventListener('input', () => {
      if (hint && hint.classList.contains('error')) {
        hint.textContent = 'opens your default mail client';
        hint.className = 'form-hint';
      }
    });
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Boot-up intro: cycle each pipeline step pending → running → success,
  // animate the progress bar, update top-bar run status + log line.
  async function runPipelineIntro() {
    const steps = Array.from(document.querySelectorAll('.pipe-step'));
    const arrows = Array.from(document.querySelectorAll('.pipe-arrow'));
    const fill = document.getElementById('pipe-fill');
    const log = document.getElementById('pipe-log');
    const runStatus = document.getElementById('run-status');

    if (steps.length === 0) return;

    const messages = {
      build:   { run: 'compiling identity manifest...',     done: 'identity verified' },
      test:    { run: 'running skills.spec...',             done: '24/24 tools passed' },
      deploy:  { run: 'rolling out experience...',          done: '3 roles deployed' },
      certify: { run: 'verifying AWS Credly badges...',      done: '2 AWS certs valid' },
      monitor: { run: 'scraping metrics & SLOs...',          done: 'all systems nominal' },
      notify:  { run: 'opening webhook channels...',         done: 'webhook ready' },
    };

    if (prefersReducedMotion()) {
      steps.forEach((s) => (s.dataset.status = 'success'));
      arrows.forEach((a) => a.classList.add('passed'));
      if (fill) fill.style.width = '100%';
      if (log) { log.textContent = '✓ pipeline complete'; log.classList.add('success'); }
      setRunStatusSuccess(runStatus);
      return;
    }

    setRunStatusRunning(runStatus);
    if (log) log.textContent = '$ runner #42 acquiring agent...';
    await wait(200);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const key = step.dataset.step;
      const msg = messages[key] || { run: 'working...', done: 'ok' };
      const prevArrow = arrows[i - 1];

      if (prevArrow) {
        prevArrow.classList.remove('active');
        prevArrow.classList.add('passed');
      }
      const nextArrow = arrows[i];
      if (nextArrow) nextArrow.classList.add('active');

      step.dataset.status = 'running';
      if (log) log.textContent = `▶ [${key}] ${msg.run}`;

      await wait(500 + Math.random() * 180);

      step.dataset.status = 'success';
      if (log) log.textContent = `✓ [${key}] ${msg.done}`;
      if (fill) fill.style.width = `${((i + 1) / steps.length) * 100}%`;

      await wait(90);
    }

    const last = arrows[arrows.length - 1];
    if (last) { last.classList.remove('active'); last.classList.add('passed'); }

    if (log) {
      log.textContent = '✓ pipeline complete · welcome to the portfolio';
      log.classList.add('success');
    }
    setRunStatusSuccess(runStatus);
    await wait(400);
  }

  function setRunStatusRunning(el) {
    if (!el) return;
    el.innerHTML =
      '<span class="dot dot-running"></span><span>run #42 · running</span>';
  }
  function setRunStatusSuccess(el) {
    if (!el) return;
    el.innerHTML =
      '<span class="dot" style="background: var(--green); box-shadow: 0 0 8px var(--green);"></span>' +
      '<span>run #42 · success</span>';
  }

  function setFooterYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }

  // Animate the `data-type` text inside .typed spans sequentially.
  function typeCommands() {
    const typed = Array.from(document.querySelectorAll('.typed'));
    if (typed.length === 0) return;

    let queue = Promise.resolve();
    typed.forEach((node) => {
      const text = node.dataset.type || '';
      queue = queue.then(() => typeInto(node, text, 38)).then(() => wait(220));
    });
  }

  function typeInto(node, text, speedMs) {
    return new Promise((resolve) => {
      let i = 0;
      const tick = () => {
        node.textContent = text.slice(0, i++);
        if (i <= text.length) {
          setTimeout(tick, speedMs);
        } else {
          resolve();
        }
      };
      tick();
    });
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // Reveal stages as user scrolls; flip their badge to "success" when seen.
  function revealStagesOnScroll() {
    const stages = document.querySelectorAll('.stage');
    if (!('IntersectionObserver' in window)) {
      stages.forEach((s) => s.classList.add('in-view'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    stages.forEach((s) => io.observe(s));
  }

  // Animate metric numbers from 0 -> data-count when the section enters view.
  function animateCounters() {
    const metrics = document.querySelectorAll('.metric-value');
    if (metrics.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      metrics.forEach((m) => (m.textContent = formatMetric(m)));
      return;
    }

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
    metrics.forEach((m) => io.observe(m));
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
      const value = Math.round(target * eased);
      el.textContent = value + suffix;
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(frame);
  }

  function formatMetric(el) {
    return (el.dataset.count || '0') + (el.dataset.suffix || '');
  }

  // Animated canvas network — drifting nodes connected by lines (cluster vibe).
  function startBackgroundNetwork() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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

})();
