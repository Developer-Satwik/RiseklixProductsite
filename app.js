const navWrap = document.querySelector('.nav-wrap');
const menu = document.querySelector('.menu');
const links = document.querySelector('.nav-links');
const year = document.querySelector('[data-year]');

if (year) year.textContent = new Date().getFullYear();

function scrolled() {
  if (!navWrap) return;
  navWrap.classList.toggle('scrolled', window.scrollY > 16);
  const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
  navWrap.style.setProperty('--scroll-progress', `${progress}%`);
}
scrolled();
window.addEventListener('scroll', scrolled, { passive: true });
window.addEventListener('resize', scrolled, { passive: true });

// v29 mobile navigation: fixed, modal-like, scroll-safe, and intentionally animated.
// It locks the page behind the menu so cards/hero elements cannot visually pass over it.
let mobileNavScrim = null;
let lockedScrollY = 0;

function ensureMobileNavScrim() {
  if (mobileNavScrim) return mobileNavScrim;
  mobileNavScrim = document.createElement('button');
  mobileNavScrim.type = 'button';
  mobileNavScrim.className = 'mobile-nav-scrim';
  mobileNavScrim.setAttribute('aria-label', 'Close navigation menu');
  mobileNavScrim.hidden = true;
  document.body.appendChild(mobileNavScrim);
  mobileNavScrim.addEventListener('click', closeMobileNav);
  return mobileNavScrim;
}

function lockPageScroll() {
  lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  document.documentElement.classList.add('nav-open');
  document.body.classList.add('nav-open');
  document.body.dataset.navLockedScroll = String(lockedScrollY);
}

function restoreScrollInstantly(targetY) {
  const html = document.documentElement;
  const previousScrollBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, targetY);
  window.requestAnimationFrame(() => {
    html.style.scrollBehavior = previousScrollBehavior;
    scrolled();
  });
}

function unlockPageScroll({ restoreScroll = true } = {}) {
  const restoreY = Number(document.body.dataset.navLockedScroll || lockedScrollY || 0);
  document.documentElement.classList.remove('nav-open');
  document.body.classList.remove('nav-open');

  // Clean up legacy fixed-body styles from older builds so closing the menu never flashes to the top.
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.body.style.removeProperty('--locked-scroll-y');
  delete document.body.dataset.navLockedScroll;

  if (restoreScroll) restoreScrollInstantly(restoreY);
  else scrolled();
}

function closeMobileNav(options = {}) {
  if (!links || !menu) return;
  const { restoreScroll = true } = options;
  links.classList.remove('open');
  if (navWrap) navWrap.classList.remove('menu-open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Open navigation menu');
  menu.textContent = 'Menu';
  links.setAttribute('aria-hidden', window.innerWidth <= 900 ? 'true' : 'false');
  if (mobileNavScrim) {
    mobileNavScrim.classList.remove('is-visible');
    window.setTimeout(() => {
      if (!links.classList.contains('open')) mobileNavScrim.hidden = true;
    }, 120);
  }
  if (document.body.classList.contains('nav-open')) unlockPageScroll({ restoreScroll });
}

if (menu && links) {
  menu.setAttribute('aria-label', 'Open navigation menu');
  const syncNavAria = () => {
    links.setAttribute('aria-hidden', window.innerWidth <= 900 && !links.classList.contains('open') ? 'true' : 'false');
  };
  syncNavAria();

  const openMobileNav = () => {
    const scrim = ensureMobileNavScrim();
    scrim.hidden = false;
    requestAnimationFrame(() => scrim.classList.add('is-visible'));
    links.classList.add('open');
    links.setAttribute('aria-hidden', 'false');
    if (navWrap) navWrap.classList.add('menu-open');
    menu.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-label', 'Close navigation menu');
    menu.textContent = 'Close';
    lockPageScroll();
  };

  const toggleMobileNav = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (links.classList.contains('open')) closeMobileNav();
    else openMobileNav();
  };

  menu.addEventListener('click', toggleMobileNav);

  links.querySelectorAll('a').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      if (!links.classList.contains('open') || window.innerWidth > 900) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      const target = new URL(href, window.location.href);
      if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target || target.origin !== window.location.origin) {
        closeMobileNav({ restoreScroll: false });
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      closeMobileNav({ restoreScroll: false });
      window.setTimeout(() => {
        if (target.pathname === window.location.pathname && target.hash) {
          window.location.hash = target.hash;
        } else if (target.href !== window.location.href) {
          window.location.assign(target.href);
        }
      }, 10);
    });
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMobileNav();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMobileNav();
    syncNavAria();
  }, { passive: true });
}

document.querySelectorAll('[data-magnetic]').forEach((el) => {
  el.addEventListener('mousemove', (event) => {
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.025}px, ${y * 0.04}px) rotate(-3deg)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = '';
  });
});

const reveal = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      entry.target.animate(
        [
          { opacity: 0, transform: 'translateY(24px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' }
      );
      io.unobserve(entry.target);
    });
  }, { threshold: 0.14 });

  reveal.forEach((el) => {
    el.style.opacity = 0;
    io.observe(el);
  });
}

// Reel Vault: end-aware player.
// Local MP4/WebM and direct Drive video streams move to the next reel only when the real media ends.
// If Google Drive blocks direct streaming, we fall back to Drive preview and keep it manual instead of cutting early.
(function reelVault() {
  const player = document.querySelector('[data-reel-player]');
  if (!player) return;

  const meta = document.querySelector('[data-reel-meta]');
  const strip = document.querySelector('[data-reel-strip]');
  const prev = document.querySelector('[data-reel-prev]');
  const next = document.querySelector('[data-reel-next]');
  const count = document.querySelector('[data-reel-count]');
  const state = document.querySelector('[data-reel-state]');
  const folder = window.RISEKLIX_PORTFOLIO_FOLDER || 'https://drive.google.com/drive/folders/1B0jFiVURGXHkuLzrDApdlou8Uop3_1U0';
  const rawVideos = Array.isArray(window.RISEKLIX_PORTFOLIO_VIDEOS) ? window.RISEKLIX_PORTFOLIO_VIDEOS : [];
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let active = 0;
  let currentMedia = null;
  let fallbackTimer = null;

  const escapeHTML = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const extractDriveId = (value) => {
    if (!value) return '';
    const text = String(value).trim();
    const fileMatch = text.match(/\/file\/d\/([^/]+)/);
    if (fileMatch) return fileMatch[1];
    const idMatch = text.match(/[?&]id=([^&]+)/);
    if (idMatch) return idMatch[1];
    if (/^[a-zA-Z0-9_-]{20,}$/.test(text)) return text;
    return '';
  };

  const isDirectVideo = (value) => /\.(mp4|webm|mov)(\?.*)?$/i.test(String(value || ''));
  const inferType = (src) => {
    const clean = String(src || '').split('?')[0].toLowerCase();
    if (clean.endsWith('.webm')) return 'video/webm';
    if (clean.endsWith('.mov')) return 'video/quicktime';
    return 'video/mp4';
  };
  const drivePreviewSrc = (id) => `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`;
  const driveDirectSrc = (id) => `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;

  const videos = rawVideos.map((video, index) => {
    const src = video.src || video.mp4 || video.localUrl || video.videoUrl || '';
    const driveId = extractDriveId(video.driveUrl || video.url || video.driveId || video.id);
    return {
      title: video.title || `Portfolio reel ${index + 1}`,
      label: video.label || video.type || 'Portfolio reel',
      note: video.note || 'Short-form editing, pacing, captions, and visual storytelling work by Riseklix.',
      src: isDirectVideo(src) ? src : '',
      poster: video.poster || '',
      driveId,
      embedOnly: Boolean(video.embedOnly),
    };
  }).filter((video) => video.src || video.driveId);

  const placeholders = [
    { title: 'Reel Loop Ready', label: 'Live deck', note: 'Add local MP4s for perfect end-detection or keep Drive previews as manual fallbacks.' },
    { title: 'Creator edits', label: 'Slot 02', note: 'Drop in vertical edits for founder, creator, podcast, or brand work.' },
    { title: 'Motion captions', label: 'Slot 03', note: 'Use this slot for typography-heavy edits and retention captions.' },
    { title: 'Campaign cuts', label: 'Slot 04', note: 'Add launch, offer, or brand-campaign clips to make the proof feel alive.' },
  ];
  const items = videos.length ? videos : placeholders;

  function clearFallbackTimer() {
    if (fallbackTimer) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  }

  function go(step) {
    if (items.length < 1) return;
    clearFallbackTimer();
    active = (active + step + items.length) % items.length;
    render();
  }

  function updateMeta(item) {
    if (meta) {
      meta.innerHTML = `<div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.note)}</p></div><span class="reel-badge">${escapeHTML(item.label)}</span>`;
    }
    if (count) count.textContent = `${active + 1} / ${items.length}`;
    if (strip) {
      strip.innerHTML = items.map((thumb, i) => `
        <button class="reel-thumb ${i === active ? 'is-active' : ''}" type="button" data-reel-index="${i}" aria-label="Show ${escapeHTML(thumb.title)}">
          <span>${escapeHTML(thumb.label)}</span>
          <strong>${escapeHTML(thumb.title)}</strong>
        </button>
      `).join('');
      strip.querySelectorAll('[data-reel-index]').forEach((btn) => {
        btn.addEventListener('click', () => {
          active = Number(btn.dataset.reelIndex);
          render();
        });
      });
    }
  }

  function setState(message) {
    if (state) state.textContent = message;
  }

  function renderIframeFallback(item) {
    currentMedia = null;
    clearFallbackTimer();
    player.innerHTML = `
      <iframe src="${drivePreviewSrc(item.driveId)}" loading="lazy" allow="autoplay; fullscreen" allowfullscreen title="${escapeHTML(item.title)}"></iframe>
      <span class="reel-live-pill">Drive preview</span>
      <span class="reel-fallback-note">Use arrows after the reel finishes</span>
    `;
    setState('Drive preview mode. Use the arrows to move through the portfolio without extra thumbnail buttons.');
  }

  function renderNativeVideo(item, src, type) {
    const poster = item.poster ? ` poster="${escapeHTML(item.poster)}"` : '';
    player.innerHTML = `
      <video class="reel-video" autoplay muted playsinline controls preload="metadata"${poster} title="${escapeHTML(item.title)}">
        <source src="${escapeHTML(src)}" type="${type}">
        Your browser does not support this video.
      </video>
      <span class="reel-live-pill">End-aware loop</span>
      <span class="reel-progress" aria-hidden="true"><i></i></span>
    `;

    const video = player.querySelector('video');
    const progress = player.querySelector('.reel-progress i');
    currentMedia = video;

    if (!video) return;

    let hasStarted = false;
    let fellBack = false;

    const fallbackToDrivePreview = () => {
      if (!item.driveId || item.src || fellBack) return;
      fellBack = true;
      renderIframeFallback(item);
    };

    video.addEventListener('loadedmetadata', () => {
      hasStarted = true;
      clearFallbackTimer();
      const duration = Number.isFinite(video.duration) ? Math.round(video.duration) : null;
      setState(duration ? `Playing ${active + 1} of ${items.length}. Next starts after this ${duration}s clip ends.` : 'Playing. It changes only when the clip ends.');
    });

    video.addEventListener('timeupdate', () => {
      if (!progress || !Number.isFinite(video.duration) || video.duration <= 0) return;
      progress.style.width = `${Math.min(100, (video.currentTime / video.duration) * 100)}%`;
    });

    video.addEventListener('ended', () => {
      if (progress) progress.style.width = '100%';
      if (!reduceMotion && items.length > 1) {
        go(1);
      } else {
        video.currentTime = 0;
        video.play().catch(() => setState('Tap play once to restart the reel.'));
      }
    });

    video.addEventListener('error', () => {
      clearFallbackTimer();
      if (item.driveId && !item.src) {
        fallbackToDrivePreview();
      } else {
        setState('This reel could not load. Use the arrows to move to the next piece.');
      }
    });

    if (item.driveId && !item.src) {
      fallbackTimer = window.setTimeout(() => {
        if (!hasStarted && video.readyState === 0) fallbackToDrivePreview();
      }, 9000);
    }

    video.play().catch(() => {
      setState('Autoplay was blocked by the browser. Tap play once; after that the deck advances only when the reel ends.');
    });
  }

  function renderPlaceholder(item) {
    currentMedia = null;
    clearFallbackTimer();
    player.innerHTML = `
      <div class="reel-empty">
        <div class="reel-orbit" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
        <div class="reel-empty-inner">
          <span class="giant">REEL<br>LOOP</span>
          <p>Your Drive folder stays below as the archive. Add individual Drive links or local MP4s to make this hero area loop like a living portfolio wall.</p>
          <a class="mini-link" href="${escapeHTML(folder)}" target="_blank" rel="noopener">Open folder ↗</a>
        </div>
      </div>
    `;
    setState('Ready for reels. Add local MP4s for perfect end-aware autoplay.');
  }

  function render() {
    clearFallbackTimer();
    const item = items[active];
    updateMeta(item);

    if (item.src) {
      renderNativeVideo(item, item.src, inferType(item.src));
      return;
    }

    if (item.driveId && !item.embedOnly) {
      renderNativeVideo(item, driveDirectSrc(item.driveId), 'video/mp4');
      return;
    }

    if (item.driveId) {
      renderIframeFallback(item);
      return;
    }

    renderPlaceholder(item);
  }

  player.addEventListener('mouseenter', () => {
    if (currentMedia && !currentMedia.paused) currentMedia.pause();
  });
  player.addEventListener('mouseleave', () => {
    if (currentMedia && currentMedia.paused && !currentMedia.ended) {
      currentMedia.play().catch(() => {});
    }
  });

  if (prev) prev.addEventListener('click', () => go(-1));
  if (next) next.addEventListener('click', () => go(1));

  render();
})();

// v18 micro-interaction layer: pointer spotlight + button tap confirmation.
(() => {
  const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const surfaces = document.querySelectorAll('.card, .case, .process-item, .metric, .tagbox, .reel-card, .drive-vault, .manifesto-board');
  surfaces.forEach((surface) => {
    surface.classList.add('is-micro-surface');
    if (!surface.querySelector(':scope > .micro-glow')) {
      const glow = document.createElement('span');
      glow.className = 'micro-glow';
      glow.setAttribute('aria-hidden', 'true');
      surface.appendChild(glow);
    }
    if (!canHover) return;
    surface.addEventListener('pointermove', (event) => {
      const rect = surface.getBoundingClientRect();
      surface.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      surface.style.setProperty('--my', `${event.clientY - rect.top}px`);
    }, { passive: true });
  });
})();


// v19 lightweight scroll theatre: word reveal + section entrance without scroll listeners.
(() => {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const splitTargets = Array.from(document.querySelectorAll('.display, .xl'))
    .filter((el) => !el.dataset.motionSplit && el.textContent.trim().length < 120 && !el.closest('.footer'));

  splitTargets.forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.dataset.motionSplit = 'true';
    el.innerHTML = words.map((word, i) => `<span class="motion-word" style="--i:${i}">${word}</span>`).join(' ');
  });

  document.querySelectorAll('.card, .case, .process-item, .tagbox, .reel-card, .drive-vault, .manifesto-board, .kpi, .form, .calendly-card')
    .forEach((el) => el.classList.add('scroll-scene'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('[data-motion-split="true"], .scroll-scene').forEach((el) => observer.observe(el));


  // Safety: never leave split headlines blurred if a browser delays IntersectionObserver.
  window.setTimeout(() => {
    document.querySelectorAll('[data-motion-split="true"]').forEach((el) => el.classList.add('is-visible'));
  }, 900);

})();

// v42 Riseklix OS: Riseklix Run — a tiny pixel platformer that teaches the revenue path.
(() => {
  const root = document.querySelector('[data-pixel-console]');
  const modal = document.querySelector('[data-rk-os]');
  if (!root || !modal) return;

  const startButton = root.querySelector('[data-os-open]');
  const scene = root.querySelector('.pixel-scene');
  const closeControls = modal.querySelectorAll('[data-os-close]');
  const canvas = modal.querySelector('[data-run-canvas]');
  const startScreen = modal.querySelector('[data-run-start-screen]');
  const winScreen = modal.querySelector('[data-run-win-screen]');
  const startRunButton = modal.querySelector('[data-run-start]');
  const resetButton = modal.querySelector('[data-run-reset]');
  const cta = modal.querySelector('[data-game-cta]');
  const terminal = modal.querySelector('[data-run-terminal]');
  const scoreLabel = modal.querySelector('[data-run-score]');
  const stageLabel = modal.querySelector('[data-run-stage]');
  const healthLabel = modal.querySelector('[data-run-health]');
  const controlButtons = modal.querySelectorAll('[data-run-control]');

  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = canvas.width;
  const H = canvas.height;
  const worldW = 1680;
  const groundY = 224;
  const gravity = 1120;
  const maxSpeed = 180;
  const jumpPower = 410;
  let raf = 0;
  let lastFrame = 0;
  let playing = false;
  let won = false;
  let lastFocus = null;
  let exitTimer = null;
  let cameraX = 0;
  let score = 0;
  let hearts = 3;
  let messageTimer = 0;
  let boostTimer = 0;
  let portalOpen = false;
  let keys = Object.create(null);
  let touchedGround = false;

  const player = { x: 34, y: 166, vx: 0, vy: 0, w: 20, h: 26, flip: 1, grounded: false, inv: 0 };
  const particles = [];
  let pickups = [];
  let enemies = [];
  let platforms = [];
  let portal = { x: 1560, y: 160, w: 44, h: 64 };

  const emit = (name, payload = {}) => {
    if (typeof window.rkTrackEvent === 'function') window.rkTrackEvent(name, payload);
  };

  const terminalLines = (lines) => {
    if (!terminal) return;
    terminal.innerHTML = lines.map((line) => `&gt; ${line}`).join('<br/>');
    terminal.classList.remove('pulse');
    void terminal.offsetWidth;
    terminal.classList.add('pulse');
  };

  const restartConsoleBurst = () => {
    if (!scene) return;
    scene.classList.remove('play');
    void scene.offsetWidth;
    scene.classList.add('play');
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rectsHit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const addBurst = (x, y, color = '#c7ff2d', count = 8) => {
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x, y,
        vx: (Math.random() - .5) * 180,
        vy: -60 - Math.random() * 150,
        life: .45 + Math.random() * .35,
        color,
        size: 2 + Math.random() * 3
      });
    }
  };

  const makePickup = (x, y, kind, label) => ({ x, y, w: 20, h: 20, kind, label, bob: Math.random() * 9, taken: false });
  const makeEnemy = (x, y, kind, label, patrol = 60) => ({ x, y, baseX: x, w: 24, h: 22, kind, label, dir: Math.random() > .5 ? 1 : -1, patrol, speed: 28 + Math.random() * 14, alive: true });

  const buildLevel = () => {
    platforms = [
      { x: 0, y: groundY, w: worldW, h: 52, kind: 'ground' },
      { x: 170, y: 184, w: 92, h: 12 },
      { x: 330, y: 156, w: 106, h: 12 },
      { x: 542, y: 190, w: 126, h: 12 },
      { x: 760, y: 160, w: 116, h: 12 },
      { x: 980, y: 184, w: 132, h: 12 },
      { x: 1190, y: 154, w: 118, h: 12 },
      { x: 1398, y: 188, w: 104, h: 12 }
    ];
    pickups = [
      makePickup(190, 150, 'hook', 'HOOK'),
      makePickup(360, 122, 'proof', 'PROOF'),
      makePickup(566, 156, 'matcha', 'MATCHA'),
      makePickup(635, 156, 'money', '$'),
      makePickup(796, 126, 'mic', 'MIC'),
      makePickup(1018, 150, 'magnet', 'REPLY'),
      makePickup(1218, 120, 'ad', 'AD'),
      makePickup(1434, 154, 'key', 'OFFER KEY'),
      makePickup(1510, 190, 'money', '$')
    ];
    enemies = [
      makeEnemy(270, 202, 'dislike', 'DISLIKE MONSTER'),
      makeEnemy(470, 202, 'slime', 'VANITY SLIME'),
      makeEnemy(705, 202, 'ghost', 'SKIP GHOST'),
      makeEnemy(910, 202, 'bat', 'ALGO BAT'),
      makeEnemy(1130, 202, 'zombie', 'DEAD LEAD'),
      makeEnemy(1340, 202, 'dislike', 'DISLIKE MONSTER')
    ];
  };

  const resetGame = () => {
    cancelAnimationFrame(raf);
    buildLevel();
    player.x = 34; player.y = 166; player.vx = 0; player.vy = 0; player.flip = 1; player.inv = 0; player.grounded = false;
    cameraX = 0; score = 0; hearts = 3; won = false; playing = false; portalOpen = false; boostTimer = 0; messageTimer = 0; touchedGround = false;
    keys = Object.create(null);
    particles.length = 0;
    if (startScreen) startScreen.hidden = false;
    if (winScreen) winScreen.hidden = true;
    updateHUD('WORLD 1-1 / FEED STREET', 'PRESS START');
    terminalLines(['press START.', 'collect HOOK + PROOF + OFFER KEY.', 'dodge dislike monsters and vanity slime.']);
    draw();
  };

  const updateHUD = (stage = 'WORLD 1-1 / FEED STREET', status = '') => {
    if (scoreLabel) scoreLabel.textContent = `REV ${String(score).padStart(3, '0')}`;
    if (healthLabel) healthLabel.textContent = '♥ '.repeat(Math.max(0, hearts)).trim() || '0';
    if (stageLabel) stageLabel.textContent = stage;
    if (status) modal.dataset.runStatus = status;
  };

  const openOS = () => {
    lastFocus = document.activeElement;
    window.clearTimeout(exitTimer);
    restartConsoleBurst();
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('rk-os-open');
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
      resetGame();
      startRunButton?.focus({ preventScroll: true });
    });
    emit('rk_os_platformer_opened');
  };

  const closeOS = () => {
    cancelAnimationFrame(raf);
    playing = false;
    modal.classList.add('is-exiting');
    modal.classList.remove('is-open');
    exitTimer = window.setTimeout(() => {
      modal.hidden = true;
      modal.classList.remove('is-exiting', 'game-complete');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('rk-os-open');
      restartConsoleBurst();
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
    }, 340);
  };

  const startRun = () => {
    resetGame();
    playing = true;
    if (startScreen) startScreen.hidden = true;
    terminalLines(['klix runner online.', 'space / jump clears monsters.', 'reach the BOOKED CALL portal.']);
    canvas.focus?.({ preventScroll: true });
    emit('rk_os_platformer_started');
    lastFrame = performance.now();
    raf = requestAnimationFrame(loop);
  };

  const winGame = () => {
    if (won) return;
    won = true;
    playing = false;
    modal.classList.add('game-complete');
    addBurst(player.x + player.w / 2, player.y + 8, '#ffd166', 34);
    updateHUD('PIPELINE CLEARED', 'REVENUE UNLOCKED');
    terminalLines(['pipeline cleared.', 'attention → trust → demand → booked call.', 'reward unlocked: revenue map call.']);
    emit('rk_os_platformer_completed', { score, hearts });
    window.setTimeout(() => {
      if (winScreen) winScreen.hidden = false;
      cta?.focus({ preventScroll: true });
    }, 420);
  };

  const loseHeart = (enemyLabel) => {
    if (player.inv > 0 || won) return;
    hearts -= 1;
    player.inv = 1.15;
    player.vx = -130;
    player.vy = -170;
    addBurst(player.x + 10, player.y + 14, '#ff3ea5', 12);
    const roasts = {
      'DISLIKE MONSTER': 'dislike monster hit. proof shield would help.',
      'VANITY SLIME': 'vanity slime touched. shiny but broke.',
      'SKIP GHOST': 'skip ghost stole attention. stronger hook needed.',
      'ALGO BAT': 'algorithm bat attack. do not panic post.',
      'DEAD LEAD': 'dead lead bumped you. follow-up matters.'
    };
    terminalLines([roasts[enemyLabel] || 'noise hit.', 'keep running. revenue is ahead.']);
    updateHUD('WORLD 1-1 / FEED STREET', 'NOISE HIT');
    emit('rk_os_platformer_enemy_hit', { enemy: enemyLabel, hearts });
    if (hearts <= 0) {
      hearts = 3;
      player.x = Math.max(34, cameraX + 28);
      player.y = 130;
      terminalLines(['respawned by emergency matcha.', 'try again. avoid vanity metrics.']);
    }
  };

  const collectPickup = (item) => {
    if (item.taken) return;
    item.taken = true;
    const points = { hook: 20, proof: 25, matcha: 10, money: 15, mic: 18, magnet: 18, ad: 20, key: 45 }[item.kind] || 10;
    score += points;
    if (item.kind === 'matcha') boostTimer = 4.2;
    if (item.kind === 'key') portalOpen = true;
    const lines = {
      hook: 'hook coin caught. attention loaded.',
      proof: 'proof shield equipped. trust upgraded.',
      matcha: 'matcha boost activated. founder focus +100.',
      money: 'money pixel collected. revenue score up.',
      mic: 'podcast mic found. one asset becomes many clips.',
      magnet: 'reply magnet online. warm leads incoming.',
      ad: 'ad spark captured. reach boosted.',
      key: 'offer key unlocked. booked-call portal opening.'
    };
    terminalLines([lines[item.kind] || 'asset collected.', portalOpen ? 'reach the portal.' : 'keep building the pipeline.']);
    addBurst(item.x + item.w / 2, item.y + item.h / 2, item.kind === 'money' ? '#ffd166' : '#c7ff2d', 12);
    emit('rk_os_platformer_powerup', { type: item.kind, score });
  };

  const collidePlatforms = (dt) => {
    player.grounded = false;
    for (const p of platforms) {
      if (!rectsHit(player, p)) continue;
      const prevBottom = player.y + player.h - player.vy * dt;
      if (prevBottom <= p.y + 4 && player.vy >= 0) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.grounded = true;
        touchedGround = true;
      } else if (player.y < p.y + p.h && player.y + player.h > p.y + 5) {
        if (player.x + player.w / 2 < p.x + p.w / 2) player.x = p.x - player.w;
        else player.x = p.x + p.w;
        player.vx *= -.18;
      }
    }
  };

  const update = (dt) => {
    const left = keys.ArrowLeft || keys.a || keys.left;
    const right = keys.ArrowRight || keys.d || keys.right;
    const jump = keys.ArrowUp || keys.w || keys[' '] || keys.jump;
    const speed = boostTimer > 0 ? maxSpeed * 1.26 : maxSpeed;

    if (left) { player.vx -= speed * 6 * dt; player.flip = -1; }
    if (right) { player.vx += speed * 6 * dt; player.flip = 1; }
    if (!left && !right) player.vx *= Math.pow(.001, dt);
    player.vx = clamp(player.vx, -speed, speed);

    if (jump && player.grounded) {
      player.vy = -jumpPower;
      player.grounded = false;
      addBurst(player.x + 10, player.y + player.h, '#36a8e6', 5);
    }

    player.vy += gravity * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.x = clamp(player.x, 8, worldW - 30);
    collidePlatforms(dt);
    if (player.y > H + 80) {
      player.x = Math.max(34, cameraX + 26);
      player.y = 90;
      player.vx = 0; player.vy = 0;
      loseHeart('NO-CTA PIT');
    }

    enemies.forEach((e) => {
      if (!e.alive) return;
      e.x += e.dir * e.speed * dt;
      if (e.x > e.baseX + e.patrol || e.x < e.baseX - e.patrol) e.dir *= -1;
      if (rectsHit(player, e)) {
        if (player.vy > 80 && player.y + player.h - e.y < 18) {
          e.alive = false;
          player.vy = -260;
          score += 18;
          addBurst(e.x + e.w / 2, e.y + e.h / 2, '#ff3ea5', 15);
          terminalLines([`${e.label.toLowerCase()} stomped.`, 'proof beats noise.']);
          emit('rk_os_platformer_enemy_stomp', { enemy: e.label });
        } else {
          loseHeart(e.label);
        }
      }
    });

    pickups.forEach((item) => {
      if (!item.taken && rectsHit(player, item)) collectPickup(item);
      item.bob += dt * 4;
    });

    if (rectsHit(player, portal) && portalOpen) winGame();
    if (rectsHit(player, portal) && !portalOpen && messageTimer <= 0) {
      messageTimer = 1.5;
      terminalLines(['portal locked.', 'find the OFFER KEY first.']);
    }

    if (player.inv > 0) player.inv -= dt;
    if (boostTimer > 0) boostTimer -= dt;
    if (messageTimer > 0) messageTimer -= dt;

    particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 380 * dt; p.life -= dt; });
    for (let i = particles.length - 1; i >= 0; i -= 1) if (particles[i].life <= 0) particles.splice(i, 1);

    cameraX += (clamp(player.x - W * .36, 0, worldW - W) - cameraX) * .12;
    updateHUD(portalOpen ? 'OFFER KEY ACQUIRED' : 'WORLD 1-1 / FEED STREET', boostTimer > 0 ? 'MATCHA BOOST' : 'RUNNING');
  };

  const pixelText = (text, x, y, size = 8, color = '#fff8ee', align = 'left') => {
    ctx.fillStyle = color;
    ctx.font = `900 ${size}px IBM Plex Mono, monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillText(text, Math.round(x), Math.round(y));
  };

  const drawPlayer = (x, y) => {
    const blink = player.inv > 0 && Math.floor(performance.now() / 90) % 2 === 0;
    if (blink) return;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (player.flip < 0) { ctx.scale(-1, 1); ctx.translate(-player.w, 0); }
    ctx.fillStyle = '#050509'; ctx.fillRect(3, 2, 16, 21);
    ctx.fillStyle = '#2f77d8'; ctx.fillRect(4, 2, 13, 7);
    ctx.fillStyle = '#31c8e8'; ctx.fillRect(2, 8, 18, 8);
    ctx.fillStyle = '#8740b5'; ctx.fillRect(5, 16, 12, 6);
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(13, 6, 3, 3);
    ctx.fillStyle = '#050509'; ctx.fillRect(14, 7, 2, 2);
    ctx.fillStyle = '#c7ff2d'; ctx.fillRect(17, 12, 4, 4);
    ctx.fillStyle = '#050509'; ctx.fillRect(3, 23, 5, 3); ctx.fillRect(13, 23, 5, 3);
    ctx.restore();
  };

  const drawPickup = (item, cx) => {
    if (item.taken) return;
    const x = Math.round(item.x - cx);
    const y = Math.round(item.y + Math.sin(item.bob) * 3);
    const colors = {
      hook: '#c7ff2d', proof: '#36a8e6', matcha: '#9cff6a', money: '#ffd166', mic: '#ff3ea5', magnet: '#7de2ff', ad: '#fff8ee', key: '#ffd166'
    };
    ctx.fillStyle = '#050509'; ctx.fillRect(x + 2, y + 2, 18, 18);
    ctx.fillStyle = colors[item.kind] || '#c7ff2d'; ctx.fillRect(x, y, 18, 18);
    ctx.fillStyle = '#050509';
    if (item.kind === 'money') { pixelText('$', x + 4, y + 2, 12, '#050509'); }
    else if (item.kind === 'matcha') { ctx.fillRect(x + 5, y + 4, 8, 10); ctx.fillStyle = '#fff8ee'; ctx.fillRect(x + 7, y + 2, 5, 2); }
    else if (item.kind === 'key') { ctx.fillRect(x + 4, y + 8, 10, 3); ctx.fillRect(x + 12, y + 6, 3, 7); }
    else { pixelText(item.label.slice(0, 1), x + 5, y + 3, 11, '#050509'); }
  };

  const drawEnemy = (e, cx) => {
    if (!e.alive) return;
    const x = Math.round(e.x - cx), y = Math.round(e.y);
    ctx.fillStyle = '#050509'; ctx.fillRect(x + 3, y + 3, e.w, e.h);
    if (e.kind === 'ghost') {
      ctx.fillStyle = '#f0e7ff'; ctx.fillRect(x, y, 22, 18); ctx.fillRect(x, y + 16, 5, 5); ctx.fillRect(x + 8, y + 16, 5, 5); ctx.fillRect(x + 17, y + 16, 5, 5);
      ctx.fillStyle = '#050509'; ctx.fillRect(x + 5, y + 6, 3, 3); ctx.fillRect(x + 14, y + 6, 3, 3);
    } else if (e.kind === 'bat') {
      ctx.fillStyle = '#743fb9'; ctx.fillRect(x + 7, y + 5, 10, 10); ctx.fillRect(x, y + 8, 8, 5); ctx.fillRect(x + 17, y + 8, 8, 5);
      ctx.fillStyle = '#c7ff2d'; ctx.fillRect(x + 10, y + 8, 2, 2); ctx.fillRect(x + 15, y + 8, 2, 2);
    } else {
      ctx.fillStyle = e.kind === 'slime' ? '#ff3ea5' : '#ff5b62';
      ctx.fillRect(x, y + 5, 24, 17); ctx.fillRect(x + 4, y, 16, 8);
      ctx.fillStyle = '#fff8ee'; ctx.fillRect(x + 5, y + 9, 4, 4); ctx.fillRect(x + 15, y + 9, 4, 4);
      ctx.fillStyle = '#050509'; ctx.fillRect(x + 6, y + 10, 2, 2); ctx.fillRect(x + 16, y + 10, 2, 2);
    }
  };

  const draw = () => {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    const cx = cameraX;

    // Pixel sky + social-feed grid.
    ctx.fillStyle = '#081026'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0d1940';
    for (let x = -((cx * .25) % 36); x < W; x += 36) ctx.fillRect(Math.round(x), 0, 1, H);
    for (let y = 16; y < H; y += 28) ctx.fillRect(0, y, W, 1);

    // Distant buildings/cards.
    for (let i = 0; i < 12; i += 1) {
      const bx = Math.round(i * 170 - (cx * .35) % 170);
      ctx.fillStyle = i % 2 ? '#11245a' : '#142b6f';
      ctx.fillRect(bx, 132 - (i % 4) * 12, 72, 98);
      ctx.fillStyle = 'rgba(199,255,45,.55)';
      ctx.fillRect(bx + 10, 148, 8, 8); ctx.fillRect(bx + 28, 166, 8, 8); ctx.fillRect(bx + 48, 154, 8, 8);
    }

    // Platforms.
    platforms.forEach((p) => {
      const x = Math.round(p.x - cx);
      if (x + p.w < -20 || x > W + 20) return;
      ctx.fillStyle = '#050509'; ctx.fillRect(x, p.y + 5, p.w, p.h);
      ctx.fillStyle = p.kind === 'ground' ? '#201322' : '#f7eedf'; ctx.fillRect(x, p.y, p.w, p.h);
      ctx.fillStyle = p.kind === 'ground' ? '#743fb9' : '#c7ff2d';
      for (let tx = 0; tx < p.w; tx += 18) ctx.fillRect(x + tx, p.y, 9, 3);
    });

    // Signs.
    const signs = [
      { x: 40, t: 'FEED STREET' },
      { x: 520, t: 'PROOF BRIDGE' },
      { x: 1040, t: 'DEMAND LANE' },
      { x: 1470, t: 'CALL PORTAL' }
    ];
    signs.forEach((s) => {
      const x = Math.round(s.x - cx);
      if (x < -120 || x > W + 30) return;
      ctx.fillStyle = '#050509'; ctx.fillRect(x + 3, 108, 76, 24);
      ctx.fillStyle = '#fff8ee'; ctx.fillRect(x, 105, 76, 24);
      pixelText(s.t, x + 6, 113, 7, '#050509');
      ctx.fillStyle = '#050509'; ctx.fillRect(x + 8, 129, 5, 28);
    });

    pickups.forEach((item) => drawPickup(item, cx));
    enemies.forEach((e) => drawEnemy(e, cx));

    // Portal.
    const px = Math.round(portal.x - cx);
    ctx.fillStyle = '#050509'; ctx.fillRect(px + 4, portal.y + 4, portal.w, portal.h);
    ctx.fillStyle = portalOpen ? '#ffd166' : '#313446'; ctx.fillRect(px, portal.y, portal.w, portal.h);
    ctx.fillStyle = portalOpen ? '#c7ff2d' : '#64708a'; ctx.fillRect(px + 8, portal.y + 10, portal.w - 16, portal.h - 20);
    pixelText(portalOpen ? 'CALL' : 'LOCK', px + 8, portal.y + 28, 7, '#050509');

    drawPlayer(player.x - cx, player.y);

    particles.forEach((p) => {
      ctx.globalAlpha = clamp(p.life * 2.2, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - cx), Math.round(p.y), Math.round(p.size), Math.round(p.size));
      ctx.globalAlpha = 1;
    });

    // Mini instruction strip.
    if (!playing && !won) {
      ctx.fillStyle = 'rgba(5,5,9,.52)'; ctx.fillRect(10, 14, 230, 26);
      pixelText('collect attention. dodge vanity. unlock revenue.', 18, 23, 8, '#fff8ee');
    }
  };

  const loop = (now) => {
    if (!playing || won) { draw(); return; }
    const dt = Math.min(34, now - lastFrame || 16) / 1000;
    lastFrame = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  };

  const keyName = (key) => key.length === 1 ? key.toLowerCase() : key;
  const down = (control) => { keys[control] = true; };
  const up = (control) => { keys[control] = false; };

  startButton?.addEventListener('click', openOS);
  closeControls.forEach((control) => control.addEventListener('click', closeOS));
  startRunButton?.addEventListener('click', startRun);
  resetButton?.addEventListener('click', startRun);
  cta?.addEventListener('click', () => emit('rk_os_platformer_cta_click', { cta: 'book_revenue_map' }));

  modal.addEventListener('keydown', (event) => {
    const k = keyName(event.key);
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','d',' ','Enter'].includes(k)) event.preventDefault();
    if ((k === 'Enter' || k === ' ') && !playing && !won && !modal.hidden) startRun();
    keys[k] = true;
  });
  modal.addEventListener('keyup', (event) => { keys[keyName(event.key)] = false; });

  controlButtons.forEach((button) => {
    const control = button.dataset.runControl;
    const mapped = control === 'left' ? 'left' : control === 'right' ? 'right' : 'jump';
    const press = (event) => { event.preventDefault(); down(mapped); if (!playing && !won) startRun(); };
    const release = (event) => { event.preventDefault(); up(mapped); };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeOS();
  });

  draw();
})();

// v39 desktop-only pixel firefly. Tiny, butterfly-like, cursor-aware, and revenue-CTA curious.
(() => {
  const canRun = window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canRun || reduceMotion) return;

  const bug = document.createElement('span');
  bug.className = 'pixel-firefly';
  bug.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bug);

  const state = {
    x: Math.max(120, window.innerWidth * 0.72),
    y: Math.max(120, window.innerHeight * 0.32),
    vx: 0,
    vy: 0,
    tx: window.innerWidth * 0.76,
    ty: window.innerHeight * 0.34,
    mouseX: null,
    mouseY: null,
    mode: 'wander',
    nextDecision: 0,
    perchUntil: 0,
    targetEl: null,
    finalButton: null,
    finalTriggered: false,
    finalObserver: null,
    phaseA: Math.random() * Math.PI * 2,
    phaseB: Math.random() * Math.PI * 2,
    orbit: Math.random() * Math.PI * 2,
    lastTime: performance.now()
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const visibleRect = (el) => {
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width < 24 || rect.height < 24) return null;
    if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) return null;
    return rect;
  };

  const getRevenueCTA = () => {
    const direct = document.querySelector('[data-firefly-revenue-cta]');
    if (direct) return direct;
    return Array.from(document.querySelectorAll('a[href*="/contact#book-call"], a[href*="#book-call"]'))
      .find((el) => !el.closest('.nav-wrap, .nav, .nav-cta') && /book strategy call/i.test(el.textContent || '') && (el.closest('.tight') || el.closest('.blueprint')));
  };

  const getStrategyButtons = () => Array.from(document.querySelectorAll('a[href*="#book-call"], a[href*="/contact#book-call"]'))
    .filter((el) => {
      // Keep the firefly away from the persistent navbar CTA. It should only perch on
      // in-page conversion buttons where the tiny detail feels intentional, not distracting.
      if (el.closest('.nav-wrap, .nav, .nav-cta')) return false;
      if (el.matches('[data-firefly-revenue-cta]')) return false;
      return /strategy|book/i.test(el.textContent || '') && visibleRect(el);
    });

  const pickWanderTarget = () => {
    state.mode = 'wander';
    state.targetEl = null;
    state.tx = clamp(90 + Math.random() * (window.innerWidth - 180), 44, window.innerWidth - 44);
    state.ty = clamp(92 + Math.random() * (window.innerHeight - 198), 68, window.innerHeight - 62);
    state.nextDecision = performance.now() + 1500 + Math.random() * 2300;
    bug.classList.remove('is-perched', 'is-golding');
  };

  const perchOnButton = (button, options = {}) => {
    const rect = visibleRect(button);
    if (!rect) return false;
    state.mode = options.final ? 'final' : 'perch';
    state.targetEl = button;
    state.tx = rect.left + rect.width - Math.min(18, Math.max(10, rect.width * 0.08));
    state.ty = rect.top + Math.min(20, rect.height * 0.45);
    state.perchUntil = performance.now() + (options.final ? 4200 : 2000 + Math.random() * 1400);
    state.nextDecision = state.perchUntil;
    bug.classList.add('is-perched');
    return true;
  };

  const createGoldBurst = (button) => {
    if (!button || button.classList.contains('firefly-gold-text')) return;
    button.classList.add('firefly-gold-text');
    bug.classList.add('is-golding');

    const rect = button.getBoundingClientRect();
    const originX = rect.left + rect.width - 16;
    const originY = rect.top + rect.height * 0.5;
    const count = 18;
    for (let i = 0; i < count; i += 1) {
      const pixel = document.createElement('i');
      pixel.className = 'firefly-gold-pixel';
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.7;
      const distance = 18 + Math.random() * 34;
      pixel.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
      pixel.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
      pixel.style.left = `${originX}px`;
      pixel.style.top = `${originY}px`;
      document.body.appendChild(pixel);
      window.setTimeout(() => pixel.remove(), 1050);
    }

    window.rkTrackEvent?.('rk_firefly_gold_cta', { section: 'home revenue cta' });

    window.setTimeout(() => {
      bug.classList.remove('is-golding');
      state.mode = 'wander';
      state.targetEl = null;
      pickWanderTarget();
    }, 1250);
  };

  const decide = () => {
    const finalCTA = getRevenueCTA();
    const finalRect = visibleRect(finalCTA);
    if (!state.finalTriggered && finalCTA && finalRect && finalRect.top > 64 && finalRect.bottom < window.innerHeight - 20) {
      state.finalTriggered = true;
      perchOnButton(finalCTA, { final: true });
      return;
    }

    const buttons = getStrategyButtons();
    if (buttons.length && Math.random() > 0.45) {
      const preferred = buttons.find((btn) => btn.closest('.hero, .footer-cta, .contact-card')) || buttons[0];
      if (perchOnButton(preferred)) return;
    }
    pickWanderTarget();
  };

  const observeFinalCTA = () => {
    const finalCTA = getRevenueCTA();
    if (!finalCTA || !('IntersectionObserver' in window)) return;
    state.finalObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry || state.finalTriggered || !entry.isIntersecting || entry.intersectionRatio < 0.55) return;
      state.finalTriggered = true;
      perchOnButton(finalCTA, { final: true });
      window.setTimeout(() => createGoldBurst(finalCTA), 900);
      state.finalObserver?.disconnect();
    }, { threshold: [0.55, 0.75], rootMargin: '-10% 0px -8% 0px' });
    state.finalObserver.observe(finalCTA);
  };

  window.addEventListener('mousemove', (event) => {
    state.mouseX = event.clientX;
    state.mouseY = event.clientY;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    state.mouseX = null;
    state.mouseY = null;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    if ((state.mode === 'perch' || state.mode === 'final') && state.targetEl) {
      const rect = visibleRect(state.targetEl);
      if (rect) {
        state.tx = rect.left + rect.width - Math.min(18, Math.max(10, rect.width * 0.08));
        state.ty = rect.top + Math.min(20, rect.height * 0.45);
      } else if (state.mode !== 'final') {
        pickWanderTarget();
      }
    }
  }, { passive: true });

  const frame = (now) => {
    const dt = Math.min(34, now - state.lastTime) / 16.67;
    state.lastTime = now;
    state.phaseA += 0.038 * dt;
    state.phaseB += 0.026 * dt;
    state.orbit += 0.055 * dt;

    if (now > state.nextDecision) {
      if ((state.mode === 'perch' || state.mode === 'final') && now < state.perchUntil) {
        // keep resting
      } else if (state.mode === 'final') {
        createGoldBurst(state.targetEl);
      } else {
        decide();
      }
    }

    if ((state.mode === 'perch' || state.mode === 'final') && state.targetEl) {
      const rect = visibleRect(state.targetEl);
      if (rect) {
        state.tx = rect.left + rect.width - Math.min(18, Math.max(10, rect.width * 0.08));
        state.ty = rect.top + Math.min(20, rect.height * 0.45);
      }
    }

    const dxTarget = state.tx - state.x;
    const dyTarget = state.ty - state.y;
    const distTarget = Math.max(1, Math.hypot(dxTarget, dyTarget));
    let ax = dxTarget * (state.mode === 'wander' ? 0.0065 : 0.018);
    let ay = dyTarget * (state.mode === 'wander' ? 0.0065 : 0.018);

    // Butterfly-like movement: a soft tangential force plus layered sine drift creates arcs
    // and looped flutter instead of straight point-to-point lines.
    if (state.mode === 'wander') {
      const tangentX = -dyTarget / distTarget;
      const tangentY = dxTarget / distTarget;
      const wing = Math.sin(state.phaseA) * 0.16 + Math.sin(state.phaseB * 1.7) * 0.08;
      ax += tangentX * wing + Math.sin(now / 370) * 0.035;
      ay += tangentY * wing + Math.cos(now / 520) * 0.032;
      ax += Math.cos(state.orbit * 0.7) * 0.018;
      ay += Math.sin(state.orbit * 1.1) * 0.016;
    } else {
      ax += Math.sin(state.phaseA * 2.1) * 0.012;
      ay += Math.cos(state.phaseB * 2.3) * 0.01;
    }

    if (state.mouseX !== null && state.mode !== 'final') {
      const dx = state.x - state.mouseX;
      const dy = state.y - state.mouseY;
      const d2 = dx * dx + dy * dy;
      const avoidRadius = 126;
      if (d2 < avoidRadius * avoidRadius && d2 > 1) {
        const d = Math.sqrt(d2);
        const force = (avoidRadius - d) / avoidRadius;
        ax += (dx / d) * force * 1.65;
        ay += (dy / d) * force * 1.65;
      }
    }

    const drag = state.mode === 'wander' ? 0.885 : 0.74;
    state.vx = (state.vx + ax * dt) * drag;
    state.vy = (state.vy + ay * dt) * drag;

    // Keep tiny bursts organic but never too fast.
    const speed = Math.hypot(state.vx, state.vy);
    const maxSpeed = state.mode === 'wander' ? 4.2 : 5.1;
    if (speed > maxSpeed) {
      state.vx = (state.vx / speed) * maxSpeed;
      state.vy = (state.vy / speed) * maxSpeed;
    }

    state.x = clamp(state.x + state.vx * dt, 16, window.innerWidth - 24);
    state.y = clamp(state.y + state.vy * dt, 62, window.innerHeight - 24);

    const tilt = clamp(state.vx * 4.5, -18, 18);
    const bob = state.mode === 'wander' ? Math.sin(state.phaseA * 2.6) * 1.2 : 0;
    bug.style.transform = `translate3d(${state.x}px, ${state.y + bob}px, 0) rotate(${tilt}deg)`;
    requestAnimationFrame(frame);
  };

  setTimeout(() => {
    bug.classList.add('is-live');
    observeFinalCTA();
    decide();
    requestAnimationFrame(frame);
  }, 900);
})();

// v38 analytics, conversion tracking, performance checkpoint, and safe micro-interactions.
(() => {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGtag = () => typeof window.gtag === 'function';

  window.rkTrackEvent = function rkTrackEvent(name, params = {}) {
    const payload = {
      page_path: window.location.pathname,
      page_title: document.title,
      ...params,
    };
    if (hasGtag()) {
      window.gtag('event', name, payload);
    } else {
      (window.__rkEventQueue = window.__rkEventQueue || []).push([name, payload]);
    }
  };

  window.addEventListener('load', () => {
    if (hasGtag() && Array.isArray(window.__rkEventQueue)) {
      window.__rkEventQueue.splice(0).forEach(([name, payload]) => window.gtag('event', name, payload));
    }
  }, { once: true });

  const labelFor = (el) => (el?.textContent || el?.getAttribute('aria-label') || el?.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 96);
  const closestSection = (el) => el?.closest('section')?.id || el?.closest('section')?.querySelector('.eyebrow,.section-label')?.textContent?.trim() || 'unknown';

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.btn, button, a');
    if (!button) return;

    if (button.matches('a[href*="/contact#book-call"], a[href*="#book-call"]')) {
      window.rkTrackEvent('rk_strategy_call_click', {
        click_text: labelFor(button),
        section: closestSection(button),
        destination: button.getAttribute('href') || '',
      });
    }

    if (button.closest('.service-card')) {
      const card = button.closest('.service-card');
      window.rkTrackEvent('rk_service_card_clicked', {
        service_name: card.querySelector('h3')?.textContent?.trim() || labelFor(button),
        click_text: labelFor(button),
      });
    }

    if (button.closest('.case')) {
      const card = button.closest('.case');
      const href = button.getAttribute('href') || '';
      if (href) {
        window.rkTrackEvent('rk_case_study_opened', {
          case_name: card.querySelector('h3')?.textContent?.trim() || 'case study',
          destination: href,
          click_text: labelFor(button),
        });
      }
    }

    if (button.matches('[data-reel-next], [data-reel-prev]') || button.closest('.reel-card,.drive-vault') || (button.getAttribute('href') || '').includes('drive.google.com')) {
      window.rkTrackEvent('rk_portfolio_reel_click', {
        click_text: labelFor(button),
        destination: button.getAttribute('href') || '',
      });
    }

    if (button.matches('.menu')) {
      window.rkTrackEvent('rk_mobile_menu_click', {
        state: button.getAttribute('aria-expanded') === 'true' ? 'open' : 'closed',
      });
    }

    if (button.matches('[data-os-open]')) {
      window.rkTrackEvent('rk_os_opened', { click_text: labelFor(button) || 'Press Start' });
    }

    if (button.matches('[data-os-app]')) {
      window.rkTrackEvent('rk_os_app_clicked', {
        app_name: button.dataset.osApp || labelFor(button),
        click_text: labelFor(button),
      });
    }


    if (button.matches('[data-game-step]')) {
      window.rkTrackEvent('rk_os_game_tile_click', {
        step: button.dataset.gameStep || '',
        tile_name: button.querySelector('strong')?.textContent?.trim() || labelFor(button),
      });
    }

    if (button.matches('[data-game-cta]')) {
      window.rkTrackEvent('rk_os_game_cta_click', { click_text: labelFor(button) });
    }
  }, { capture: true });

  // Lazy-load Calendly only when the booking block is requested or close to view.
  const calendlyWidget = document.querySelector('.calendly-inline-widget');
  if (calendlyWidget) {
    const calendlyUrl = calendlyWidget.getAttribute('data-url') || '';
    let calendlyLoading = false;
    let calendlyLoaded = false;
    const loadCalendly = () => {
      if (calendlyLoading || calendlyLoaded || !calendlyUrl) return;
      calendlyLoading = true;
      calendlyWidget.innerHTML = '<div class="calendly-placeholder is-loading"><p>Loading calendar...</p></div>';
      const initCalendly = () => {
        if (!window.Calendly?.initInlineWidget) return;
        calendlyWidget.innerHTML = '';
        window.Calendly.initInlineWidget({ url: calendlyUrl, parentElement: calendlyWidget });
        calendlyLoaded = true;
        window.rkTrackEvent('rk_calendly_loaded', { calendly_url: calendlyUrl });
      };
      if (window.Calendly?.initInlineWidget) {
        initCalendly();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.addEventListener('load', initCalendly, { once: true });
      script.addEventListener('error', () => {
        calendlyLoading = false;
        calendlyWidget.innerHTML = '<div class="calendly-placeholder"><p>Calendar could not load. Use the booking link instead.</p><a class="btn primary" href="https://calendly.com/riseklix/30min" rel="noopener" target="_blank">Open calendar</a></div>';
      }, { once: true });
      document.head.appendChild(script);
    };

    calendlyWidget.innerHTML = '<div class="calendly-placeholder"><p>Ready to book a 30-minute strategy call?</p><button class="btn primary" type="button" data-calendly-load>Load calendar</button><a class="mini-link" href="https://calendly.com/riseklix/30min" rel="noopener" target="_blank">Open in Calendly &nearr;</a></div>';
    calendlyWidget.querySelector('[data-calendly-load]')?.addEventListener('click', loadCalendly);

    if (location.hash === '#book-call') loadCalendly();
    else if ('IntersectionObserver' in window) {
      const calendlyObserver = new IntersectionObserver((entries, observer) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        loadCalendly();
      }, { rootMargin: '360px 0px' });
      calendlyObserver.observe(calendlyWidget);
    } else {
      window.addEventListener('load', loadCalendly, { once: true });
    }
  }

  // Calendly posts interaction messages from its iframe.
  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://calendly.com') return;
    const data = event.data || {};
    if (typeof data.event !== 'string' || !data.event.startsWith('calendly.')) return;
    const mapped = {
      'calendly.profile_page_viewed': 'rk_calendly_loaded',
      'calendly.event_type_viewed': 'rk_calendly_event_type_viewed',
      'calendly.date_and_time_selected': 'rk_calendly_time_selected',
      'calendly.event_scheduled': 'rk_calendly_scheduled',
    };
    window.rkTrackEvent(mapped[data.event] || 'rk_calendly_embed_event', {
      calendly_event: data.event,
    });
  });

  // Button ripple — decorative only, never blocks clicks.
  if (!reduceMotion) {
    document.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('pointerdown', (event) => {
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'rk-ripple';
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        btn.appendChild(ripple);
        window.setTimeout(() => ripple.remove(), 620);
      });
    });

    // Card spotlight on hover for pointer devices only.
    if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      document.querySelectorAll('.card,.service-card,.case,.tagbox,.kpi,.process-item').forEach((el) => {
        el.addEventListener('pointermove', (event) => {
          const rect = el.getBoundingClientRect();
          el.style.setProperty('--spot-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
          el.style.setProperty('--spot-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
          el.classList.add('is-spotlit');
        });
        el.addEventListener('pointerleave', () => el.classList.remove('is-spotlit'));
      });
    }
  }

  // Count stats only when they enter the viewport.
  const statNumbers = Array.from(document.querySelectorAll('.stat strong')).filter((el) => /\d/.test(el.textContent || ''));
  const parseStat = (text) => {
    const raw = String(text || '').trim();
    const match = raw.match(/^([\d,.]+)(.*)$/);
    if (!match) return null;
    return { value: Number(match[1].replace(/,/g, '')), suffix: match[2] || '' };
  };
  const animateStat = (el) => {
    const parsed = parseStat(el.textContent);
    if (!parsed || el.dataset.counted) return;
    el.dataset.counted = 'true';
    el.classList.add('is-counting');
    if (reduceMotion) return;
    const start = performance.now();
    const duration = 980;
    const from = Math.max(0, Math.round(parsed.value * 0.72));
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (parsed.value - from) * eased);
      el.textContent = `${value}${parsed.suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const statsIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateStat(entry.target);
        statsIO.unobserve(entry.target);
      });
    }, { threshold: 0.45 });
    statNumbers.forEach((el) => statsIO.observe(el));
  } else {
    statNumbers.forEach(animateStat);
  }

  // Lightweight Core Web Vitals checkpoint. Sends metric events where browser support exists.
  const sendVital = (metric, value, extra = {}) => {
    if (!Number.isFinite(value)) return;
    window.rkTrackEvent('rk_core_web_vital', {
      metric_name: metric,
      metric_value: Math.round(value),
      ...extra,
    });
  };

  try {
    let lcpValue = 0;
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) lcpValue = last.startTime;
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    window.addEventListener('pagehide', () => sendVital('LCP', lcpValue), { once: true });
  } catch (error) {}

  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) clsValue += entry.value;
      });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    window.addEventListener('pagehide', () => sendVital('CLS', clsValue * 1000), { once: true });
  } catch (error) {}

  try {
    let inpValue = 0;
    const interactionMap = new Map();
    const inpObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (!entry.interactionId) return;
        const current = interactionMap.get(entry.interactionId) || 0;
        const next = Math.max(current, entry.duration || 0);
        interactionMap.set(entry.interactionId, next);
        inpValue = Math.max(inpValue, next);
      });
    });
    inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 });
    window.addEventListener('pagehide', () => sendVital('INP', inpValue), { once: true });
  } catch (error) {}
})();

// v49: simple Studio Doctrine pixel-logo rain reveal. Starts from v44 and removes character/duel complexity.
(() => {
  const logo = document.querySelector('.manifesto-pixel-mark');
  const board = logo?.closest('.manifesto-board');
  if (!logo || !board) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    logo.classList.add('logo-rain-complete');
    return;
  }

  const colors = ['#31c8e8', '#36a8e6', '#2f77d8', '#624fc8', '#8740b5', '#c040bb'];
  let started = false;

  const spawnPixelRain = () => {
    const isMobile = window.matchMedia('(max-width: 680px)').matches;
    const count = isMobile ? 24 : 38;

    for (let i = 0; i < count; i += 1) {
      const p = document.createElement('i');
      p.className = 'logo-rain-particle';

      const isLeadPixel = i < 2;
      const delay = isLeadPixel
        ? (i === 0 ? 0.08 : 0.72)
        : 1.05 + ((i - 2) * (isMobile ? 0.052 : 0.038)) + (Math.random() * 0.08);

      p.style.setProperty('--px', isLeadPixel ? `${42 + i * 14}%` : `${8 + Math.random() * 82}%`);
      p.style.setProperty('--pc', colors[i % colors.length]);
      p.style.setProperty('--delay', `${delay}s`);
      p.style.setProperty('--pd', `${0.82 + Math.random() * 0.34}s`);
      p.style.setProperty('--drop', `${34 + Math.random() * (isMobile ? 48 : 62)}px`);
      p.style.setProperty('--drift', `${(Math.random() - 0.5) * (isLeadPixel ? 10 : 24)}px`);
      if (isLeadPixel) p.classList.add('logo-rain-particle-lead');
      logo.appendChild(p);
      window.setTimeout(() => p.remove(), 4600);
    }
  };

  const startReveal = () => {
    if (started) return;
    started = true;
    logo.classList.add('logo-rain-ready');
    requestAnimationFrame(() => {
      spawnPixelRain();
      logo.classList.add('logo-rain-start');
      window.rkTrackEvent?.('rk_pixel_logo_rain_reveal', { section: 'studio doctrine' });
      window.setTimeout(() => logo.classList.add('logo-rain-complete'), 3600);
    });
  };

  // Prepare the pixels after first paint so no-JS users still see the logo normally.
  requestAnimationFrame(() => logo.classList.add('logo-rain-ready'));

  if (!('IntersectionObserver' in window)) {
    window.setTimeout(startReveal, 400);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        startReveal();
        observer.disconnect();
      }
    });
  }, { threshold: 0.42, rootMargin: '0px 0px -8% 0px' });

  observer.observe(board);
})();


// v51: Rise Weekly newsletter signup via secure Netlify Function.
(() => {
  const forms = document.querySelectorAll('[data-newsletter-form]');
  if (!forms.length) return;

  const endpoint = '/.netlify/functions/beehiiv-subscribe';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const setStatus = (form, message, type = '') => {
    const status = form.querySelector('.newsletter-status');
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
    status.classList.remove('success', 'error');
    if (type) status.classList.add(type);
  };

  forms.forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const email = String(data.get('email') || '').trim().toLowerCase();
      const consent = data.get('consent') === 'on';
      const company = String(data.get('company') || '').trim();
      const button = form.querySelector('button[type="submit"]');

      if (!emailPattern.test(email)) {
        setStatus(form, 'Enter a valid email address.', 'error');
        return;
      }
      if (!consent) {
        setStatus(form, 'Please confirm consent before joining Rise Weekly.', 'error');
        return;
      }

      form.classList.add('is-loading');
      if (button) button.textContent = 'Joining…';
      setStatus(form, 'Adding you to Rise Weekly…');

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            consent,
            company,
            page_path: window.location.pathname,
            referrer: document.referrer || '',
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.ok) {
          throw new Error(payload.message || 'Could not subscribe right now.');
        }
        form.reset();
        setStatus(form, payload.message || 'You are in. Check your inbox for Rise Weekly.', 'success');
        window.rkTrackEvent?.('rk_newsletter_signup', { source: 'rise_weekly_footer' });
      } catch (error) {
        setStatus(form, error.message || 'Could not subscribe right now. Try again in a moment.', 'error');
      } finally {
        form.classList.remove('is-loading');
        if (button) button.textContent = 'Join';
      }
    });
  });
})();


// --- v20260924 interactive recommendation trace ---
(() => {
  const root = document.querySelector('[data-product-console]');
  if (!root) return;

  const tabs = Array.from(root.querySelectorAll('[data-console-system]'));
  const panel = root.querySelector('.console-panel');
  const model = root.querySelector('[data-console-model]');
  const companyState = root.querySelector('[data-company-state]');
  const companyNote = root.querySelector('[data-company-note]');
  const companyCard = root.querySelector('[data-company-card]');
  const competitorState = root.querySelector('[data-competitor-state]');
  const competitorNote = root.querySelector('[data-competitor-note]');
  const competitorCard = root.querySelector('[data-competitor-card]');
  const traceAnswer = root.querySelector('[data-trace-answer]');
  const traceSource = root.querySelector('[data-trace-source]');
  const traceFinding = root.querySelector('[data-trace-finding]');
  const finding = root.querySelector('[data-console-finding]');
  const action = root.querySelector('[data-console-action]');
  const plan = root.querySelector('[data-console-plan]');
  const planTitle = root.querySelector('[data-plan-title]');
  const planDetail = root.querySelector('[data-plan-detail]');
  const announcer = root.querySelector('[data-console-announcer]');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const states = {
    chatgpt: {
      label: 'ChatGPT',
      company: 'Included',
      companyNote: 'You make the shortlist, but not as the first choice.',
      companyTone: 'positive',
      competitor: 'Recommended',
      competitorNote: 'Another provider is named first.',
      competitorTone: 'warning',
      answer: 'Your company appears in the shortlist.',
      source: 'Competitor comparison pages carry denser proof.',
      traceFinding: 'Comparison proof is too thin.',
      finding: 'Build one evidence-backed comparison page.',
      planTitle: 'Make the comparison decision easier to verify.',
      planDetail: 'Show who you fit, the tradeoffs, concrete proof, and why a buyer would choose you over the leading alternative.'
    },
    gemini: {
      label: 'Gemini',
      company: 'Not included',
      companyNote: 'The answer explains the category but skips your brand.',
      companyTone: 'negative',
      competitor: 'Included',
      competitorNote: 'A clearer category match earns the slot.',
      competitorTone: 'warning',
      answer: 'The answer names alternatives without your company.',
      source: 'Category guides make competitor fit easier to verify.',
      traceFinding: 'Your buyer fit is not explicit enough.',
      finding: 'Clarify the buyer and category you are built for.',
      planTitle: 'Create one canonical buyer-fit page.',
      planDetail: 'State the buyer, problem, constraints, alternatives, and proof in language that can be verified without inferring your positioning.'
    },
    claude: {
      label: 'Claude',
      company: 'Included',
      companyNote: 'You appear, but the support for choosing you is generic.',
      companyTone: 'positive',
      competitor: 'Included',
      competitorNote: 'Both brands make the answer.',
      competitorTone: 'neutral',
      answer: 'Both companies appear in the response.',
      source: 'The competitor has more specific case evidence.',
      traceFinding: 'Your evidence lacks decision-level detail.',
      finding: 'Replace broad claims with concrete proof.',
      planTitle: 'Strengthen evidence where the decision happens.',
      planDetail: 'Add scoped examples, measurable outcomes, limitations, and sourceable proof directly on the pages buyers and AI systems use to compare options.'
    },
    perplexity: {
      label: 'Perplexity',
      company: 'Cited only',
      companyNote: 'Your content is used as a source, but your company is not the recommendation.',
      companyTone: 'neutral',
      competitor: 'Recommended',
      competitorNote: 'Another provider gets the commercial choice.',
      competitorTone: 'warning',
      answer: 'Your page is cited while another company is recommended.',
      source: 'Your article informs the answer; competitor proof closes the choice.',
      traceFinding: 'Cited does not equal chosen.',
      finding: 'Connect useful content to decision proof.',
      planTitle: 'Bridge information authority and commercial proof.',
      planDetail: 'Keep the useful source content, then connect it to clear product fit, comparisons, evidence, and a page that supports the actual buying decision.'
    }
  };

  const animateRefresh = () => {
    if (!panel || reduceMotion) return;
    panel.classList.remove('is-switching');
    void panel.offsetWidth;
    panel.classList.add('is-switching');
    window.setTimeout(() => panel.classList.remove('is-switching'), 320);
  };

  const render = (key, announce = true) => {
    const state = states[key] || states.chatgpt;
    tabs.forEach((tab) => {
      const active = tab.dataset.consoleSystem === key;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });

    if (model) model.textContent = state.label;
    if (companyState) companyState.textContent = state.company;
    if (companyNote) companyNote.textContent = state.companyNote;
    if (companyCard) companyCard.dataset.tone = state.companyTone;
    if (competitorState) competitorState.textContent = state.competitor;
    if (competitorNote) competitorNote.textContent = state.competitorNote;
    if (competitorCard) competitorCard.dataset.tone = state.competitorTone;
    if (traceAnswer) traceAnswer.textContent = state.answer;
    if (traceSource) traceSource.textContent = state.source;
    if (traceFinding) traceFinding.textContent = state.traceFinding;
    if (finding) finding.textContent = state.finding;
    if (planTitle) planTitle.textContent = state.planTitle;
    if (planDetail) planDetail.textContent = state.planDetail;

    root.dataset.activeSystem = key;
    animateRefresh();

    if (announce && announcer) {
      announcer.textContent = `${state.label}: ${state.company}. ${state.traceFinding}`;
    }
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => render(tab.dataset.consoleSystem));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      tabs[next].focus();
      render(tabs[next].dataset.consoleSystem);
    });
  });

  if (action && plan) {
    action.addEventListener('click', () => {
      const opening = plan.hidden;
      plan.hidden = !opening;
      action.setAttribute('aria-expanded', opening ? 'true' : 'false');
      action.firstChild.textContent = opening ? 'Close action plan ' : 'Open action plan ';
      if (opening && !reduceMotion) {
        plan.animate(
          [{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'translateY(0)'}],
          {duration:220,easing:'cubic-bezier(.2,.7,.2,1)'}
        );
      }
    });
  }

  render('chatgpt', false);
})();

// --- v20260924 Commercial Discovery scroll story ---
(() => {
  const root = document.querySelector('[data-discovery-story]');
  if (!root) return;

  const stage = root.querySelector('[data-story-stage]');
  const readout = root.querySelector('[data-story-readout]');
  const progress = root.querySelector('.story-progress');
  const steps = Array.from(root.querySelectorAll('[data-story-step]'));
  const panels = Array.from(root.querySelectorAll('[data-story-panel]'));
  const dots = Array.from(root.querySelectorAll('[data-story-dot]'));
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const labels = {
    check: '01 / CHECK',
    evidence: '02 / EVIDENCE',
    change: '03 / CHANGE',
    recheck: '04 / RECHECK'
  };

  let active = 'check';

  function setState(next, { focus = false } = {}) {
    if (!labels[next]) return;
    active = next;
    if (stage) stage.dataset.storyState = next;
    if (readout) readout.textContent = labels[next];

    steps.forEach((step) => {
      const selected = step.dataset.storyStep === next;
      step.classList.toggle('is-active', selected);
      step.setAttribute('aria-current', selected ? 'step' : 'false');
      if (selected && focus) step.focus({ preventScroll: true });
    });

    panels.forEach((panel) => {
      const selected = panel.dataset.storyPanel === next;
      panel.classList.toggle('is-active', selected);
      panel.setAttribute('aria-hidden', selected ? 'false' : 'true');
    });

    const index = Math.max(0, steps.findIndex((step) => step.dataset.storyStep === next));
    dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex <= index));
    if (progress) progress.style.setProperty('--story-progress', `${(index / Math.max(1, steps.length - 1)) * 100}%`);

    if (!reduced && stage && window.innerWidth > 1000) {
      stage.animate(
        [
          { boxShadow: '0 44px 120px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.07)' },
          { boxShadow: '0 48px 130px rgba(0,0,0,.48), 0 0 0 1px rgba(199,255,45,.08), inset 0 1px 0 rgba(255,255,255,.08)' },
          { boxShadow: '0 44px 120px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.07)' }
        ],
        { duration: 360, easing: 'cubic-bezier(.2,.7,.2,1)' }
      );
    }
  }

  steps.forEach((step) => {
    step.addEventListener('click', () => setState(step.dataset.storyStep));
    step.addEventListener('keydown', (event) => {
      if (!['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault();
      const currentIndex = steps.indexOf(step);
      if (event.key === 'Enter' || event.key === ' ') {
        setState(step.dataset.storyStep);
        return;
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const next = steps[(currentIndex + direction + steps.length) % steps.length];
      setState(next.dataset.storyStep, { focus: true });
    });
  });

  if ('IntersectionObserver' in window && window.innerWidth > 1000) {
    const observer = new IntersectionObserver((entries) => {
      const candidates = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (!candidates.length) return;
      setState(candidates[0].target.dataset.storyStep);
    }, {
      threshold: [0.2, 0.4, 0.6, 0.8],
      rootMargin: '-24% 0px -42% 0px'
    });
    steps.forEach((step) => observer.observe(step));
  }

  setState(active);
})();

// --- v20260924 Riseklix Discovery World ---
(() => {
  const root = document.querySelector('[data-discovery-world]');
  if (!root) return;
  const canvas = root.querySelector('[data-world-canvas]');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const stageLabel = root.querySelector('[data-world-stage]');
  const stageCopy = root.querySelector('[data-world-copy]');
  const controls = Array.from(root.querySelectorAll('[data-world-step]'));
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const W = canvas.width, H = canvas.height;
  const TILE_W = 68, TILE_H = 34, CUBE_H = 34;
  const ORIGIN_X = 375, ORIGIN_Y = 165;
  let stage = 0;
  let renderStage = 0;
  let last = performance.now();
  let phase = 0;

  const stages = [
    {label:'01 / START AT YOUR SITE',copy:'Research the business before testing the market.',pos:[0,4]},
    {label:'02 / CROSS THE AI GATES',copy:'The same buying decision can produce different answers.',pos:[2,3]},
    {label:'03 / COLLECT THE EVIDENCE',copy:'Trace answers back to sources, competitors, and proof.',pos:[4,3]},
    {label:'04 / FORGE THE ACTION',copy:'Turn the clearest supported gap into something you can change.',pos:[5,5]},
    {label:'05 / RECHECK THE PATH',copy:'Run the same decision again and see what moved.',pos:[7,3]}
  ];

  const palette = {
    top:'#17223e', left:'#0c1429', right:'#101b34',
    acid:'#c7ff2d', cyan:'#38d4ff', violet:'#8d54ff', hot:'#ff3ea5',
    paper:'#f5f0e8', blue:'#214cff', ink:'#050509', amber:'#ffb01f'
  };

  const iso = (gx, gy, z=0) => ({
    x: ORIGIN_X + (gx - gy) * TILE_W / 2,
    y: ORIGIN_Y + (gx + gy) * TILE_H / 2 - z * CUBE_H
  });

  const poly = (pts, fill, stroke='rgba(255,255,255,.07)') => {
    ctx.beginPath();
    pts.forEach((p,i)=> i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
  };

  const cube = (gx,gy,z=0,h=1,top=palette.top,left=palette.left,right=palette.right) => {
    const p=iso(gx,gy,z), up=h*CUBE_H;
    const T={x:p.x,y:p.y-up}, L={x:p.x-TILE_W/2,y:p.y-TILE_H/2}, R={x:p.x+TILE_W/2,y:p.y-TILE_H/2};
    const BL={x:p.x-TILE_W/2,y:p.y-TILE_H/2+up}, BR={x:p.x+TILE_W/2,y:p.y-TILE_H/2+up};
    poly([{x:T.x,y:T.y},{x:L.x,y:L.y-up},{x:p.x,y:p.y-TILE_H-up},{x:R.x,y:R.y-up}],top);
    poly([{x:T.x,y:T.y},{x:L.x,y:L.y-up},{x:BL.x,y:BL.y},{x:p.x,y:p.y}],left);
    poly([{x:T.x,y:T.y},{x:R.x,y:R.y-up},{x:BR.x,y:BR.y},{x:p.x,y:p.y}],right);
  };

  const textPixel = (txt,x,y,size=12,color='#fff',align='center') => {
    ctx.save();
    ctx.font = `800 ${size}px "IBM Plex Mono", monospace`;
    ctx.textAlign=align;ctx.textBaseline='middle';
    ctx.fillStyle='rgba(0,0,0,.52)';ctx.fillText(txt,x+2,y+2);
    ctx.fillStyle=color;ctx.fillText(txt,x,y);ctx.restore();
  };

  const drawGround = () => {
    for(let gy=0;gy<7;gy++){
      for(let gx=0;gx<9;gx++){
        const d=(gx+gy)%2;
        cube(gx,gy,0,1,d?'#101a30':'#121e37',d?'#091224':'#0a1327',d?'#0b1730':'#0c1932');
      }
    }
    // acid path through the world
    [[0,4],[1,4],[2,3],[3,3],[4,3],[5,4],[5,5],[6,4],[7,3]].forEach(([x,y],i)=>{
      const p=iso(x,y,1.02);
      poly([{x:p.x,y:p.y-2},{x:p.x-TILE_W/2,y:p.y-TILE_H/2-2},{x:p.x,y:p.y-TILE_H-2},{x:p.x+TILE_W/2,y:p.y-TILE_H/2-2}],i<=stage*2?palette.acid:'rgba(199,255,45,.12)',null);
    });
  };

  const building = (gx,gy,h,color,label) => {
    const left=color==='acid'?'#526d0b':color==='cyan'?'#0c5264':color==='violet'?'#3d246c':'#14266f';
    const right=color==='acid'?'#6d900e':color==='cyan'?'#116b82':color==='violet'?'#523090':'#1a3190';
    const top=color==='acid'?palette.acid:color==='cyan'?palette.cyan:color==='violet'?palette.violet:palette.blue;
    cube(gx,gy,1,h,top,left,right);
    const p=iso(gx,gy,1+h);
    textPixel(label,p.x,p.y-18,9,top);
  };

  const beacon = (gx,gy,color,label,active=false) => {
    cube(gx,gy,1,0.34,color,'#111827','#17213c');
    const p=iso(gx,gy,1.34);
    ctx.save();
    ctx.globalAlpha=active?(.72+.22*Math.sin(phase*4)):.28;
    ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=active?26:8;
    ctx.beginPath();ctx.arc(p.x,p.y-15,active?8:5,0,Math.PI*2);ctx.fill();ctx.restore();
    textPixel(label,p.x,p.y-34,8,active?color:'#756f82');
  };

  const character = (gx,gy) => {
    const p=iso(gx,gy,1.08);
    const bob=reduceMotion?0:Math.sin(phase*5)*3;
    ctx.save();
    ctx.translate(Math.round(p.x),Math.round(p.y-38+bob));
    // shadow
    ctx.fillStyle='rgba(0,0,0,.34)';ctx.fillRect(-13,29,26,7);
    // body
    ctx.fillStyle=palette.blue;ctx.fillRect(-12,-2,24,28);
    ctx.fillStyle='#132aaa';ctx.fillRect(-12,17,24,9);
    // head
    ctx.fillStyle=palette.paper;ctx.fillRect(-14,-23,28,22);
    // hair/mark
    ctx.fillStyle=palette.ink;ctx.fillRect(-14,-23,28,7);
    ctx.fillStyle=palette.acid;ctx.fillRect(-9,-17,7,7);
    ctx.fillStyle=palette.ink;ctx.fillRect(5,-13,4,4);
    // legs
    ctx.fillStyle=palette.paper;ctx.fillRect(-10,26,8,11);ctx.fillRect(3,26,8,11);
    ctx.restore();
  };

  const evidenceCrystal = (active) => {
    const p=iso(4,3,1.4);
    ctx.save();ctx.translate(p.x,p.y-22);
    ctx.globalAlpha=active?1:.35;
    ctx.fillStyle=palette.cyan;ctx.shadowColor=palette.cyan;ctx.shadowBlur=active?24:6;
    poly([{x:0,y:-19},{x:-11,y:-2},{x:-6,y:15},{x:7,y:15},{x:12,y:-2}],palette.cyan,null);
    ctx.restore();
    textPixel('EVIDENCE',p.x,p.y-56,8,active?palette.cyan:'#706b7c');
  };

  const actionForge = (active) => {
    building(5,5,1.2,'violet','ACTION');
    const p=iso(5,5,2.25);
    ctx.save();ctx.globalAlpha=active?(.7+.3*Math.sin(phase*5)):.15;ctx.fillStyle=palette.hot;ctx.shadowColor=palette.hot;ctx.shadowBlur=22;ctx.fillRect(p.x-10,p.y-18,20,12);ctx.restore();
  };

  const draw = () => {
    ctx.clearRect(0,0,W,H);
    // sky
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#081633');g.addColorStop(.58,'#0c1021');g.addColorStop(1,'#050509');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // stars / pixels
    ctx.fillStyle='rgba(255,255,255,.17)';
    for(let i=0;i<42;i++){const x=(i*83)%W,y=(i*47)%240;ctx.fillRect(x,y,(i%3)+1,(i%3)+1);}
    // distant block skyline
    ctx.globalAlpha=.25;
    for(let i=0;i<9;i++){const h=16+(i%4)*13;ctx.fillStyle=i%2?palette.violet:palette.blue;ctx.fillRect(i*95-30,115-h,54,h);}
    ctx.globalAlpha=1;

    drawGround();
    building(0,4,1.45,'blue','YOUR SITE');
    building(7,1,2.15,'violet','ALT');
    beacon(2,2,palette.acid,'GPT',stage>=1);
    beacon(2,3,palette.cyan,'GEM',stage>=1);
    beacon(3,2,palette.violet,'CLD',stage>=1);
    beacon(3,3,palette.hot,'PPLX',stage>=1);
    evidenceCrystal(stage>=2);
    actionForge(stage>=3);
    beacon(7,3,palette.acid,'RECHECK',stage>=4);

    const [tx,ty]=stages[stage].pos;
    const [px,py]=stages[renderStage].pos;
    character(px,py);

    // tiny signposts
    const cp=iso(7,1,3.25); textPixel('COMPETITOR',cp.x,cp.y-20,7,'#a49eaf');
  };

  function updateStage(next){
    stage=(next+stages.length)%stages.length;
    renderStage=stage;
    if(stageLabel) stageLabel.textContent=stages[stage].label;
    if(stageCopy) stageCopy.textContent=stages[stage].copy;
    controls.forEach((b,i)=>b.classList.toggle('is-active',i===stage));
    draw();
  }

  controls.forEach((btn,i)=>{
    btn.addEventListener('click',()=>updateStage(i));
    btn.addEventListener('keydown',(e)=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
      e.preventDefault();
      let n=i;
      if(e.key==='ArrowLeft') n=(i-1+controls.length)%controls.length;
      if(e.key==='ArrowRight') n=(i+1)%controls.length;
      if(e.key==='Home') n=0;
      if(e.key==='End') n=controls.length-1;
      controls[n].focus();updateStage(n);
    });
  });
  canvas.tabIndex=0;
  canvas.addEventListener('click',()=>updateStage(stage+1));
  canvas.addEventListener('keydown',(e)=>{
    if(e.key==='Enter'||e.key===' '||e.key==='ArrowRight'){e.preventDefault();updateStage(stage+1);}
    if(e.key==='ArrowLeft'){e.preventDefault();updateStage(stage-1);}
  });

  function frame(now){
    const dt=Math.min(.05,(now-last)/1000);last=now;phase+=dt;
    draw();
    if(!reduceMotion) requestAnimationFrame(frame);
  }
  updateStage(0);
  if(!reduceMotion) requestAnimationFrame(frame);
})();

// --- v20260924 Riseklix signal buttons ---
(() => {
  const buttons = Array.from(document.querySelectorAll('.btn'));
  const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  buttons.forEach((button) => {
    if (button.dataset.rkButtonReady === 'true') return;
    button.dataset.rkButtonReady = 'true';

    // Preserve all existing text/icons/markup while giving the motion layer one stable label.
    const label = document.createElement('span');
    label.className = 'btn-label';
    while (button.firstChild) label.appendChild(button.firstChild);
    button.appendChild(label);

    // Strong CTAs get a tiny 3-block signal, echoing Discovery World without becoming decorative clutter.
    if ((button.classList.contains('primary') || button.classList.contains('bluebtn')) && !button.closest('.newsletter')) {
      const signal = document.createElement('span');
      signal.className = 'btn-signal';
      signal.setAttribute('aria-hidden', 'true');
      signal.innerHTML = '<i></i><i></i><i></i>';
      button.appendChild(signal);
    }

    if (!canHover || reduceMotion) return;

    // Very small pointer bias: tactile, not "magnetic cursor" theatre.
    button.addEventListener('pointermove', (event) => {
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      button.style.setProperty('--btn-x', `${(x * 2.4).toFixed(2)}px`);
      button.style.setProperty('--btn-y', `${(y * 1.6).toFixed(2)}px`);
    }, {passive:true});

    button.addEventListener('pointerleave', () => {
      button.style.setProperty('--btn-x', '0px');
      button.style.setProperty('--btn-y', '0px');
    });
  });
})();