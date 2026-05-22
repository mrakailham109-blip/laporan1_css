/* ============================================================
   SYNCHRONIZED STACK 2026 — THE FRONTEND BLUEPRINT
   RAKA PHOTOFOLIO — script.js
   ============================================================ */

'use strict';

/* ============================================================
   00. UTILITY HELPERS
   ============================================================ */

/**
 * Shorthand querySelector
 * @param {string} selector
 * @param {Element} [scope=document]
 */
const qs  = (selector, scope = document) => scope.querySelector(selector);

/**
 * Shorthand querySelectorAll → returns Array
 * @param {string} selector
 * @param {Element} [scope=document]
 */
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];


/* ============================================================
   01. HEADER — SCROLL STATE
   Adds `.is-scrolled` class to header when page scrolls
   past a threshold. CSS handles the visual change.
   ============================================================ */

const initHeaderScroll = () => {
  const header    = qs('#site-header');
  if (!header) return;

  const THRESHOLD = 80; // px before trigger

  const onScroll = () => {
    if (window.scrollY > THRESHOLD) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  // Throttle scroll handler with requestAnimationFrame
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Run once on load in case page is refreshed mid-scroll
  onScroll();
};


/* ============================================================
   02. MOBILE NAV TOGGLE
   Toggles `.is-open` on nav list and `.is-open` on toggle btn.
   Also closes nav when a link inside it is clicked.
   ============================================================ */

const initMobileNav = () => {
  const toggle  = qs('.nav__toggle');
  const navList = qs('.nav__list');
  if (!toggle || !navList) return;

  const openNav = () => {
    toggle.classList.add('is-open');
    navList.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    // Prevent body scroll while nav is open
    document.body.style.overflow = 'hidden';
  };

  const closeNav = () => {
    toggle.classList.remove('is-open');
    navList.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const toggleNav = () => {
    const isOpen = toggle.classList.contains('is-open');
    isOpen ? closeNav() : openNav();
  };

  toggle.addEventListener('click', toggleNav);

  // Close when any nav link is clicked
  qsa('.nav__link', navList).forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  // Close when clicking outside nav area
  document.addEventListener('click', (e) => {
    const isInsideHeader = e.target.closest('#site-header');
    if (!isInsideHeader && navList.classList.contains('is-open')) {
      closeNav();
    }
  });
};


/* ============================================================
   03. ACTIVE NAV LINK ON SCROLL
   Highlights the nav link matching the currently
   visible section using IntersectionObserver.
   ============================================================ */

const initActiveNav = () => {
  const sections = qsa('section[id]');
  const navLinks = qsa('.nav__link[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const setActive = (id) => {
    navLinks.forEach(link => {
      link.classList.remove('nav__link--active');
      if (link.getAttribute('href') === `#${id}`) {
        link.classList.add('nav__link--active');
      }
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    {
      // Trigger when section enters top 40% of viewport
      rootMargin: '-10% 0px -55% 0px',
      threshold: 0,
    }
  );

  sections.forEach(section => observer.observe(section));
};


/* ============================================================
   04. SCROLL REVEAL
   Animates elements into view as they enter the viewport.
   Adds `.is-visible` class; CSS handles the transition.

   Elements to animate:
   - .bento-cell        (staggered)
   - .process-step      (staggered)
   - .stat-card         (staggered)
   - .contact-link      (staggered)
   - .hero__headline    (immediate)
   - .section__title    (immediate)
   - .about__title      (immediate)
   - .terminal-block    (immediate)
   ============================================================ */

const initScrollReveal = () => {

  // Inject the reveal base styles dynamically
  // so they are scoped to JS-enhanced experience
  const style = document.createElement('style');
  style.textContent = `
    /* Base hidden state — applied before element is revealed */
    .reveal {
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .reveal.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
    /* Stagger delay helpers */
    .reveal[data-delay="1"] { transition-delay: 0.08s; }
    .reveal[data-delay="2"] { transition-delay: 0.16s; }
    .reveal[data-delay="3"] { transition-delay: 0.24s; }
    .reveal[data-delay="4"] { transition-delay: 0.32s; }
    .reveal[data-delay="5"] { transition-delay: 0.40s; }
    .reveal[data-delay="6"] { transition-delay: 0.48s; }
    .reveal[data-delay="7"] { transition-delay: 0.56s; }
    .reveal[data-delay="8"] { transition-delay: 0.64s; }
    /* Active nav link indicator */
    .nav__link--active::after {
      width: 100% !important;
    }
  `;
  document.head.appendChild(style);

  // Selectors to reveal (immediate — no stagger)
  const immediateSelectors = [
    '.hero__headline',
    '.hero__image-wrapper',
    '.section__title',
    '.section__header-meta',
    '.about__title',
    '.about__bio',
    '.about__photo-wrapper',
    '.terminal-block',
    '.contact__text-block',
    '.contact__links-block',
  ];

  // Selectors to reveal with stagger (applied per sibling index)
  const staggeredSelectors = [
    '.bento-cell',
    '.process-step',
    '.stat-card',
    '.contact-link',
  ];

  // Apply .reveal to immediate elements
  immediateSelectors.forEach(selector => {
    qsa(selector).forEach(el => {
      el.classList.add('reveal');
    });
  });

  // Apply .reveal + data-delay to staggered siblings
  staggeredSelectors.forEach(selector => {
    // Group by parent so stagger resets per section
    const elements = qsa(selector);
    const groups   = new Map();

    elements.forEach(el => {
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });

    groups.forEach(siblings => {
      siblings.forEach((el, i) => {
        el.classList.add('reveal');
        el.setAttribute('data-delay', String(i + 1));
      });
    });
  });

  // IntersectionObserver — trigger reveal
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Stop observing once revealed
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  qsa('.reveal').forEach(el => observer.observe(el));
};


/* ============================================================
   05. TERMINAL TYPEWRITER EFFECT
   Replays a simple typewriter animation on the terminal
   blocks when they scroll into view.
   Only runs once per terminal block.
   ============================================================ */

const initTerminalTypewriter = () => {

  const terminals = qsa('.terminal-block');
  if (!terminals.length) return;

  const typeLines = (terminal) => {
    const outputLines = qsa('.terminal__line--output', terminal);
    if (!outputLines.length) return;

    // Store original text, clear content
    const originals = outputLines.map(line => {
      const text = line.textContent;
      line.textContent = '';
      return text;
    });

    let lineIndex = 0;

    const typeLine = () => {
      if (lineIndex >= outputLines.length) return;

      const line    = outputLines[lineIndex];
      const target  = originals[lineIndex];
      let   charIdx = 0;

      const typeChar = () => {
        if (charIdx < target.length) {
          line.textContent += target[charIdx];
          charIdx++;
          setTimeout(typeChar, 18);
        } else {
          lineIndex++;
          setTimeout(typeLine, 80);
        }
      };

      typeChar();
    };

    // Small delay before starting to type
    setTimeout(typeLine, 300);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          typeLines(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  terminals.forEach(t => observer.observe(t));
};


/* ============================================================
   06. BENTO CELL — TILT EFFECT ON HOVER
   Subtle 3D tilt on mouse move for bento grid cells.
   Adds a sense of depth without over-the-top animation.
   ============================================================ */

const initBentoTilt = () => {
  const cells = qsa('.bento-cell');
  if (!cells.length) return;

  // Skip on touch devices
  if (window.matchMedia('(hover: none)').matches) return;

  const MAX_TILT = 4; // degrees

  cells.forEach(cell => {
    cell.addEventListener('mousemove', (e) => {
      const rect   = cell.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const cx     = rect.width  / 2;
      const cy     = rect.height / 2;
      const tiltX  = ((y - cy) / cy) * -MAX_TILT;
      const tiltY  = ((x - cx) / cx) *  MAX_TILT;

      cell.style.transform    = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
      cell.style.transition   = 'transform 0.08s ease-out';
      cell.style.zIndex       = '2';
    });

    cell.addEventListener('mouseleave', () => {
      cell.style.transform  = '';
      cell.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      cell.style.zIndex     = '';
    });
  });
};


/* ============================================================
   07. SMOOTH SCROLL WITH HEADER OFFSET
   Overrides default anchor behavior to account for the
   fixed header height when scrolling to sections.
   ============================================================ */

const initSmoothScroll = () => {
  const HEADER_H = parseInt(
    getComputedStyle(document.documentElement)
      .getPropertyValue('--header-h'),
    10
  ) || 64;

  qsa('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = qs(targetId);
      if (!target) return;

      e.preventDefault();

      const offsetTop = target.getBoundingClientRect().top
                      + window.scrollY
                      - HEADER_H
                      - 8; // 8px breathing room

      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    });
  });
};


/* ============================================================
   08. CURSOR — CUSTOM DOT FOLLOWER
   A small accent-colored dot that follows the cursor.
   Adds personality on desktop without being intrusive.
   ============================================================ */

const initCustomCursor = () => {
  // Only on desktop with a real pointer
  if (window.matchMedia('(hover: none) or (pointer: coarse)').matches) return;

  const cursor = document.createElement('div');
  cursor.id = 'custom-cursor';
  Object.assign(cursor.style, {
    position:        'fixed',
    top:             '0',
    left:            '0',
    width:           '10px',
    height:          '10px',
    borderRadius:    '50%',
    backgroundColor: 'var(--clr-accent)',
    pointerEvents:   'none',
    zIndex:          '9999',
    transform:       'translate(-50%, -50%)',
    transition:      'opacity 0.2s, transform 0.1s',
    mixBlendMode:    'difference',
    opacity:         '0',
  });
  document.body.appendChild(cursor);

  // Outer ring
  const ring = document.createElement('div');
  ring.id = 'cursor-ring';
  Object.assign(ring.style, {
    position:        'fixed',
    top:             '0',
    left:            '0',
    width:           '36px',
    height:          '36px',
    borderRadius:    '50%',
    border:          '1.5px solid var(--clr-accent)',
    pointerEvents:   'none',
    zIndex:          '9998',
    transform:       'translate(-50%, -50%)',
    transition:      'opacity 0.2s, width 0.25s ease, height 0.25s ease',
    mixBlendMode:    'difference',
    opacity:         '0',
  });
  document.body.appendChild(ring);

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.opacity = '1';
    ring.style.opacity   = '1';
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  // Smooth ring follow via rAF
  const followRing = () => {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(followRing);
  };
  followRing();

  // Grow ring on interactive elements
  const interactiveEls = 'a, button, .bento-cell, .process-step, .stat-card';
  qsa(interactiveEls).forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.style.width  = '56px';
      ring.style.height = '56px';
    });
    el.addEventListener('mouseleave', () => {
      ring.style.width  = '36px';
      ring.style.height = '36px';
    });
  });

  // Hide on leave
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    ring.style.opacity   = '0';
  });
};


/* ============================================================
   09. HERO TITLE — GLITCH ON LOAD
   One-shot glitch animation on the hero title lines
   when the page first loads.
   ============================================================ */

const initHeroGlitch = () => {
  const titleLines = qsa('.hero__title span');
  if (!titleLines.length) return;

  // Inject glitch keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes glitch-in {
      0%   { clip-path: inset(40% 0 60% 0); transform: translate(-4px, 0); opacity: 0.7; }
      20%  { clip-path: inset(10% 0 80% 0); transform: translate(4px, 0);  opacity: 1;   }
      40%  { clip-path: inset(80% 0 5% 0);  transform: translate(-2px, 0); opacity: 0.9; }
      60%  { clip-path: inset(0% 0 0% 0);   transform: translate(0, 0);    opacity: 1;   }
      80%  { clip-path: inset(0% 0 0% 0);   transform: translate(1px, 0);  }
      100% { clip-path: inset(0% 0 0% 0);   transform: translate(0, 0);    opacity: 1;   }
    }
    .hero-line-animate {
      animation: glitch-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
  `;
  document.head.appendChild(style);

  // Stagger each line
  titleLines.forEach((line, i) => {
    setTimeout(() => {
      line.classList.add('hero-line-animate');
    }, 150 + i * 120);
  });
};


/* ============================================================
   10. FOOTER YEAR — AUTO UPDATE
   Keeps the copyright year current automatically.
   ============================================================ */

const initCopyrightYear = () => {
  const copyEl = qs('.footer__copy');
  if (!copyEl) return;

  const year = new Date().getFullYear();
  copyEl.innerHTML = copyEl.innerHTML.replace(/\d{4}/, year);
};


/* ============================================================
   11. INIT — RUN ALL MODULES
   Called on DOMContentLoaded.
   Each module is self-contained and fails silently
   if its target element is missing.
   ============================================================ */

const init = () => {
  initHeaderScroll();
  initMobileNav();
  initActiveNav();
  initScrollReveal();
  initTerminalTypewriter();
  initBentoTilt();
  initSmoothScroll();
  initCustomCursor();
  initHeroGlitch();
  initCopyrightYear();

  console.log(
    '%c SYNCHRONIZED STACK 2026 ',
    'background:#e8ff00;color:#0a0a0a;font-weight:bold;font-family:monospace;padding:4px 8px;',
    '\n%c The Frontend Blueprint — RAKA Photofolio ',
    'color:#a8cc00;font-family:monospace;'
  );
};

// Wait for DOM to be fully parsed
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}