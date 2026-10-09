/**
 * KERNL.AI — Client Interactions, Theme Controller & Shared Behaviors
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Controller (Dark / Light Mode Toggle)
  initThemeToggle();

  // 2. Universal Page Transition & Splash Screen (Every page load & redirect)
  initPageTransitions();

  // 3. Fallback for CSS Houdini @property --angle
  initHoudiniFallback();

  // 3. Active Navigation Link Highlighting
  initActiveNav();

  // 4. Mobile Navigation Drawer
  initMobileNav();

  // 5. Pip Install Clipboard Actions with Tooltip
  initPipCopyButtons();

  // 6. Citation BibTeX Modal
  initCitationModal();

  // 7. Highlight.js Code Highlighting
  if (typeof hljs !== 'undefined') {
    hljs.highlightAll();
  }

  // 8. Interactive Bar Chart Animation (Benchmark page)
  initBenchmarkBars();
});

/* --------------------------------------------------------------------------
   Theme Controller (System Sync + Manual Toggle with Persistence)
   -------------------------------------------------------------------------- */
function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  if (!toggle) return;

  const sunSvg = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const moonSvg = `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('kernl-theme', theme);
    const isDark = theme === 'dark';
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.innerHTML = isDark ? sunSvg : moonSvg;
  }

  // Initial Sync
  const saved = localStorage.getItem('kernl-theme');
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(saved || system);

  // System Preference Listener
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('kernl-theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  // User Manual Toggle
  toggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

/* --------------------------------------------------------------------------
   Universal Page Transitions & Redirect Interceptor (K Logo Animation)
   -------------------------------------------------------------------------- */
function initPageTransitions() {
  let splash = document.getElementById('splash-screen');

  // If page didn't include #splash-screen statically, create it dynamically
  if (!splash) {
    splash = document.createElement('div');
    splash.id = 'splash-screen';
    splash.innerHTML = `
      <div class="splash-content">
        <div class="splash-logo kernl-logo">
          <span class="logo-mark">K</span><span class="logo-suffix">ernl.ai</span>
        </div>
        <div class="splash-sub">Dynamic Semantic Patch Memory</div>
        <div class="splash-redirect-info"></div>
      </div>
    `;
    document.body.prepend(splash);
  }

  const splashLogo = splash.querySelector('.splash-logo') || splash.querySelector('.kernl-logo');
  const redirectInfo = splash.querySelector('.splash-redirect-info');

  // 1. Entrance animation: full "Kernl.ai", then "ernl.ai" absorbs into glowing "K"
  setTimeout(() => {
    if (splashLogo) {
      splashLogo.classList.add('absorbed');
    }
  }, 180);

  // Smooth fade-out into page
  setTimeout(() => {
    splash.classList.add('fade-out');
  }, 850);

  // 2. Intercept navigation and external redirects to display K sign first
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    // Preserve special browser clicks (new window / tab hotkeys)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Ignore in-page hash anchors, javascript, mailto, tel
    if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    // Check if external URL or internal page
    const isHttp = href.startsWith('http://') || href.startsWith('https://');
    let isExternal = false;
    let targetDomain = '';

    if (isHttp) {
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) {
          isExternal = true;
          targetDomain = url.hostname.replace(/^www\./, '');
        }
      } catch (err) {
        isExternal = true;
      }
    }

    const isBlank = link.getAttribute('target') === '_blank';

    e.preventDefault();

    // Show transition overlay with the glowing K mark
    splash.classList.remove('fade-out');
    splash.classList.add('navigating-out');
    if (splashLogo) {
      splashLogo.classList.add('absorbed');
    }

    if (redirectInfo) {
      if (isExternal) {
        redirectInfo.textContent = `Redirecting to ${targetDomain || 'external site'}...`;
        redirectInfo.classList.add('visible');
      } else {
        redirectInfo.textContent = '';
        redirectInfo.classList.remove('visible');
      }
    }

    const waitTime = isExternal ? 450 : 320;

    setTimeout(() => {
      if (isBlank) {
        window.open(href, '_blank');
        // Fade transition back out after opening external tab
        setTimeout(() => {
          splash.classList.remove('navigating-out');
          splash.classList.add('fade-out');
          if (redirectInfo) redirectInfo.classList.remove('visible');
        }, 400);
      } else {
        window.location.href = href;
      }
    }, waitTime);
  });

  // Handle bfcache (back/forward cache navigation)
  window.addEventListener('pageshow', (event) => {
    splash.classList.remove('navigating-out');
    splash.classList.add('fade-out');
    if (redirectInfo) redirectInfo.classList.remove('visible');
  });
}

/* --------------------------------------------------------------------------
   CSS Houdini @property Fallback (Safari < 16.4)
   -------------------------------------------------------------------------- */
function initHoudiniFallback() {
  if (!window.CSS || !CSS.supports('(--border-angle: 0deg)')) {
    const style = document.createElement('style');
    style.textContent = `
      .hero-card::before {
        background: linear-gradient(#4D8FFF, #00C9A7, #4D8FFF) border-box;
        animation: none;
        opacity: 0.4;
      }
      .hero-card::after { display: none; }
    `;
    document.head.appendChild(style);
  }
}

/* --------------------------------------------------------------------------
   Active Nav Indicator
   -------------------------------------------------------------------------- */
function initActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* --------------------------------------------------------------------------
   Mobile Navigation Toggle
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggle = document.querySelector('.mobile-toggle');
  const drawer = document.querySelector('.mobile-drawer');

  if (!toggle || !drawer) return;

  toggle.addEventListener('click', () => {
    drawer.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !drawer.contains(e.target)) {
      drawer.classList.remove('open');
    }
  });
}

/* --------------------------------------------------------------------------
   Pip Copy Buttons
   -------------------------------------------------------------------------- */
function initPipCopyButtons() {
  const copyButtons = document.querySelectorAll('.pip-copy-btn, .quick-install, .copy-pip-action');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const command = 'pip install dspm-memory';

      try {
        await navigator.clipboard.writeText(command);
        showTooltip(btn, 'Copied!');
      } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = command;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          showTooltip(btn, 'Copied!');
        } catch (e2) {
          showTooltip(btn, 'Failed to copy');
        }
        document.body.removeChild(textArea);
      }
    });
  });
}

function showTooltip(targetElement, message) {
  let tooltip = targetElement.querySelector('.tooltip');
  if (!tooltip) {
    tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    targetElement.appendChild(tooltip);
  }

  tooltip.textContent = message;
  tooltip.classList.add('show');

  setTimeout(() => {
    tooltip.classList.remove('show');
  }, 2000);
}

/* --------------------------------------------------------------------------
   BibTeX Citation Modal
   -------------------------------------------------------------------------- */
const bibtexEntries = {
  dspm: `@article{dubey2026dspm,
  title   = {Dynamic Semantic Patch Memory (DSPM)},
  author  = {Dubey, Dhruv},
  journal = {Zenodo Preprints},
  year    = {2026},
  doi     = {10.5281/zenodo.19438636},
  url     = {https://doi.org/10.5281/zenodo.19438636}
}`,
  sspm: `@article{dubey2026sspm,
  title   = {Structured Semantic Patch Memory (SSPM)},
  author  = {Dubey, Dhruv},
  journal = {Zenodo Preprints},
  year    = {2026},
  doi     = {10.5281/zenodo.19033643},
  url     = {https://doi.org/10.5281/zenodo.19033643}
}`
};

function initCitationModal() {
  const modal = document.getElementById('citation-modal');
  if (!modal) return;

  const modalPre = modal.querySelector('#citation-code');
  const closeBtn = modal.querySelector('.modal-close-btn');
  const copyBtn = modal.querySelector('#modal-copy-citation');
  const openButtons = document.querySelectorAll('[data-cite]');

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const citeKey = btn.getAttribute('data-cite') || 'dspm';
      const text = bibtexEntries[citeKey] || bibtexEntries.dspm;
      if (modalPre) modalPre.textContent = text;
      modal.classList.add('open');
    });
  });

  const closeModal = () => modal.classList.remove('open');

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (copyBtn && modalPre) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(modalPre.textContent);
        const orig = copyBtn.textContent;
        copyBtn.textContent = 'Copied BibTeX!';
        setTimeout(() => {
          copyBtn.textContent = orig;
        }, 2000);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    });
  }
}

/* --------------------------------------------------------------------------
   Benchmark Bar Chart Animations
   -------------------------------------------------------------------------- */
function initBenchmarkBars() {
  const bars = document.querySelectorAll('.bar-fill[data-percent]');
  if (!bars.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const pct = bar.getAttribute('data-percent');
        bar.style.width = pct + '%';
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.2 });

  bars.forEach(bar => {
    bar.style.width = '0%';
    observer.observe(bar);
  });
}
