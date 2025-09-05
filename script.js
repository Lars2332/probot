/* script.js — ProBot landing page script
   - Attach with: <script src="script.js" defer></script>
   - No external dependencies
*/

(function () {
  /* ========== Helpers ========== */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ========== Canvas particles ========== */
  const canvas = $('#bg');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  let W = window.innerWidth, H = window.innerHeight;
  let particles = [];

  const PARTICLE_DENSITY = 120000; // bigger = fewer particles

  function resizeCanvas() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    createParticles(Math.round((W * H) / PARTICLE_DENSITY));
  }

  function createParticles(n) {
    particles = [];
    const colors = [
      'rgba(79,211,255,0.12)',
      'rgba(107,140,255,0.08)',
      'rgba(255,255,255,0.06)'
    ];
    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 3 + Math.random() * 24,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.05 - Math.random() * 0.25,
        c: colors[Math.floor(Math.random() * colors.length)],
        life: 40 + Math.random() * 220,
        alpha: 0.06 + Math.random() * 0.14
      });
    }
  }

  function drawParticles() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    // subtle overlay gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(4,10,20,0.02)');
    g.addColorStop(0.5, 'rgba(3,8,18,0.02)');
    g.addColorStop(1, 'rgba(0,0,0,0.06)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'screen';
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.00002 * Math.random();
      p.life--;
      if (p.y + p.r < -40 || p.x < -80 || p.x > W + 80 || p.life < 0) {
        p.x = Math.random() * W;
        p.y = H + 40 + Math.random() * 80;
        p.r = 3 + Math.random() * 24;
        p.vx = (Math.random() - 0.5) * 0.2;
        p.vy = -0.05 - Math.random() * 0.25;
        p.c = ['rgba(79,211,255,0.12)','rgba(107,140,255,0.08)','rgba(255,255,255,0.06)'][Math.floor(Math.random()*3)];
        p.life = 40 + Math.random() * 220;
        p.alpha = 0.06 + Math.random() * 0.14;
      }

      const rg = ctx.createRadialGradient(p.x, p.y, p.r * 0.1, p.x, p.y, p.r);
      const center = p.c.replace(/[\d\.]+\)$/, '0.95)');
      rg.addColorStop(0, center);
      rg.addColorStop(0.4, p.c);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.fillStyle = rg;
      ctx.globalAlpha = p.alpha;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    requestAnimationFrame(drawParticles);
  }

  /* ========== Decorative sparkle animation (SVG points) ========== */
  const decorPoints = $$('.decor-svgs circle');

  function sparkleLoop() {
    // small, cheap sinusoidal opacity animation
    let frame = 0;
    function step() {
      frame++;
      for (let i = 0; i < decorPoints.length; i++) {
        const el = decorPoints[i];
        const t = Math.abs(Math.sin(frame * 0.02 + i));
        el.style.opacity = (0.4 + t * 0.6).toString();
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ========== Entrance classes ========== */
  function runEntrance() {
    const card = $('#card');
    const logo = document.querySelector('.logo');
    const btn = document.querySelector('.btn');
    setTimeout(() => {
      card && card.classList.add('enter');
      logo && logo.classList.add('enter');
      btn && btn.classList.add('enter');
    }, 120);
  }

  /* ========== Tilt / Parallax for card ========== */
  const cardEl = $('#card');
  let rect = cardEl ? cardEl.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };

  function updateRect() {
    if (cardEl) rect = cardEl.getBoundingClientRect();
  }

  function attachTilt() {
    updateRect();
    if (!cardEl) return;
    if (!('ontouchstart' in window)) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseleave', () => { cardEl.style.transform = ''; });
    } else {
      document.addEventListener('touchmove', onTouchMove, { passive: true });
    }
    window.addEventListener('resize', updateRect);
  }

  function onMouseMove(e) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const rx = dy * 6;
    const ry = dx * -8;
    const tz = 1 + Math.abs(dx * dy) * 0.02;
    cardEl.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${tz})`;
  }

  function onTouchMove(e) {
    updateRect();
    const t = e.touches[0];
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (t.clientX - cx) / (rect.width / 2);
    const dy = (t.clientY - cy) / (rect.height / 2);
    const rx = dy * 4;
    const ry = dx * -6;
    cardEl.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }

  /* ========== Modal + Invite logic (focus trap + keyboard) ========== */
  const oauthLink = 'https://discord.com/oauth2/authorize?client_id=1412866688843776152&permissions=8&integration_type=0&scope=bot';
  const addBtn = $('#addBtn');
  const modal = $('#inviteModal');
  const confirmBtn = $('#confirmInvite');
  const cancelBtn = $('#cancelInvite');
  const closeEls = modal ? $$( '[data-action="close"]', modal ) : [];

  function showModal() {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('show');
    // focus first actionable element
    setTimeout(() => {
      (confirmBtn || cancelBtn || addBtn).focus();
    }, 10);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onModalKey);
  }

  function hideModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('show');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onModalKey);
    addBtn && addBtn.focus();
  }

  function onModalKey(e) {
    if (e.key === 'Escape') { hideModal(); return; }
    if (e.key === 'Tab') {
      // simple focus trap
      const focusable = Array.from(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.disabled && el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  }

  function attachModalHandlers() {
    if (!addBtn) return;
    addBtn.addEventListener('click', (ev) => { ev.preventDefault(); showModal(); });

    // keyboard activation
    addBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showModal(); }
    });

    confirmBtn && confirmBtn.addEventListener('click', () => {
      // open oauth in new tab
      window.open(oauthLink, '_blank', 'noopener,noreferrer');
      hideModal();
    });
    cancelBtn && cancelBtn.addEventListener('click', hideModal);
    closeEls.forEach(el => el.addEventListener('click', hideModal));
  }

  /* ========== Init ========== */
  function init() {
    // Canvas + particles
    if (canvas && ctx) {
      resizeCanvas();
      drawParticles();
      // reduce particles on small screens for perf
      if (window.innerWidth < 600) {
        createParticles(Math.round((W * H) / (PARTICLE_DENSITY * 1.8)));
      }
      window.addEventListener('resize', () => {
        // debounce-ish small resize
        clearTimeout(window.__probotResizeTimer);
        window.__probotResizeTimer = setTimeout(() => {
          resizeCanvas();
        }, 120);
      });
    }

    // SVG sparkle loop
    if (decorPoints.length) sparkleLoop();

    // entrance
    runEntrance();

    // tilt
    attachTilt();

    // modal handlers
    if (modal) attachModalHandlers();
  }

  // run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
