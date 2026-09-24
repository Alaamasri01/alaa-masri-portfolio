'use strict';

(function () {
  const doc = document.documentElement;
  const motionOK = doc.classList.contains('motion-ok');
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pad = n => String(n).padStart(2, '0');

  /* ---------------------------------------------------------------------
     Scroll lock shared by the menu and both dialogs
     ------------------------------------------------------------------- */
  const locks = new Set();
  function lock(key, on) {
    if (on) locks.add(key); else locks.delete(key);
    document.body.classList.toggle('is-locked', locks.size > 0);
  }

  /* ---------------------------------------------------------------------
     Header: hides on scroll down, returns on scroll up
     ------------------------------------------------------------------- */
  const header = $('[data-header]');
  const nav = $('#site-nav');
  const toggle = $('.menu-toggle');
  let lastY = window.scrollY;

  function updateHeader(y) {
    if (!nav.classList.contains('is-open')) header.classList.toggle('is-hidden', y > lastY && y > 480);
    lastY = y;
  }
  // Keyboard users tabbing into the header should always see it.
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  // Match the header's ink to the section beneath it.
  if ('IntersectionObserver' in window) {
    const tone = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) header.dataset.tone = entry.target.dataset.theme;
      });
    }, { rootMargin: '0px 0px -96% 0px' });
    $$('[data-theme]').forEach(section => tone.observe(section));
  }

  /* ---------------------------------------------------------------------
     Full-screen menu
     ------------------------------------------------------------------- */
  const outside = [$('main'), $('.site-footer')];
  const clock = $('[data-clock]');
  const clockTime = $('[data-clock-time]');
  let clockTimer = null;
  let clockFormat = null;
  try {
    clockFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit', hour12: false });
  } catch (error) { clockFormat = null; }

  function tick() {
    const now = new Date();
    clockTime.textContent = clockFormat.format(now);
    clockTime.dateTime = now.toISOString();
  }
  function runClock(on) {
    if (!clockFormat) return;
    clearInterval(clockTimer);
    if (on) { tick(); clock.hidden = false; clockTimer = setInterval(tick, 15000); }
  }

  function setMenu(open, { restoreFocus = true } = {}) {
    nav.classList.toggle('is-open', open);
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    $('.menu-toggle__label', toggle).textContent = open ? 'Close' : 'Menu';
    outside.forEach(el => { if (el) el.inert = open; });
    lock('menu', open);
    runClock(open);
    if (open) {
      header.classList.remove('is-hidden');
      $('a', nav).focus({ preventScroll: true });
    } else if (restoreFocus) {
      toggle.focus();
    }
  }
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', event => {
    if (event.target.closest('a') && nav.classList.contains('is-open')) setMenu(false, { restoreFocus: false });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false);
  });

  /* ---------------------------------------------------------------------
     Active section in the navigation
     ------------------------------------------------------------------- */
  const navLinks = $$('.site-nav__list a');
  const sectionFor = { approach: 'expertise' };
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = sectionFor[entry.target.id] || entry.target.id;
        navLinks.forEach(link => {
          if (link.hash === '#' + id) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('main > section[id]').forEach(section => spy.observe(section));
  }

  /* ---------------------------------------------------------------------
     Reveal on scroll (only when motion is allowed)
     ------------------------------------------------------------------- */
  // Wrap each word of a split heading so it can rise out of its own line.
  function splitWords(root) {
    let i = 0;
    (function walk(node) {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const outer = document.createElement('span');
            const inner = document.createElement('span');
            outer.className = 'w';
            inner.textContent = part;
            inner.style.setProperty('--i', i++);
            outer.append(inner);
            frag.append(outer);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    })(root);
  }

  if (motionOK) {
    $$('[data-split]').forEach(splitWords);
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        reveal.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    const atEdge = el => el.closest('.site-footer');
    $$('[data-reveal], [data-split], [data-reveal-img]').filter(el => !atEdge(el)).forEach(el => reveal.observe(el));

    // The footer sits at the very end of the page, so it may never clear the
    // bottom margin above; reveal it as soon as part of it is on screen.
    const edge = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        edge.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    $$('.site-footer [data-split]').forEach(el => edge.observe(el));

    // Project panels reveal once a good part of them is on screen.
    const panels = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        panels.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    $$('.project').forEach(el => panels.observe(el));
  }

  /* ---------------------------------------------------------------------
     Scroll-linked motion: hero drift, stacked project panels, contact
     ------------------------------------------------------------------- */
  const heroMedia = $('[data-hero-media]');
  const heroName = $('[data-hero-name]');
  const projectItems = $$('.project');
  const parallax = $$('[data-parallax]');
  const stacked = window.matchMedia('(min-width: 761px)');
  const clamp01 = n => Math.min(1, Math.max(0, n));

  function updateMotion() {
    const vh = window.innerHeight;
    const y = window.scrollY;
    if (y < vh * 1.2) {
      heroMedia.style.transform = 'translate3d(0,' + (y * 0.32).toFixed(1) + 'px,0)';
      heroName.style.transform = 'translate3d(0,' + (y * -0.12).toFixed(1) + 'px,0)';
    }
    if (stacked.matches) {
      projectItems.forEach((item, i) => {
        const top = item.getBoundingClientRect().top;
        if (top > vh * 1.1) return;
        item.style.setProperty('--enter', clamp01(top / vh).toFixed(3));
        const next = projectItems[i + 1];
        const cover = next ? clamp01(1 - next.getBoundingClientRect().top / vh) : 0;
        item.style.setProperty('--cover', cover.toFixed(3));
      });
    }
    parallax.forEach(img => {
      const rect = img.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      img.style.transform = 'translate3d(0,' + (progress * -8).toFixed(2) + '%,0)';
    });
  }
  stacked.addEventListener('change', () => {
    if (!stacked.matches) projectItems.forEach(item => { item.style.removeProperty('--enter'); item.style.removeProperty('--cover'); });
  });

  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    updateHeader(y);
    if (motionOK) updateMotion();
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', () => { if (motionOK) updateMotion(); }, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------------
     Lightbox: one full-screen viewer for gallery and project images
     ------------------------------------------------------------------- */
  const lightbox = $('.lightbox');
  const lbImage = $('.lightbox__image', lightbox);
  const lbTitle = $('.lightbox__title', lightbox);
  const lbCount = $('.lightbox__count', lightbox);
  const lbDesc = $('.lightbox__desc', lightbox);
  const lbError = $('.lightbox__error', lightbox);
  const canDialog = typeof lightbox.showModal === 'function';
  let lbViews = [];
  let lbIndex = 0;
  let lbOpener = null;

  function showView(index) {
    lbIndex = (index + lbViews.length) % lbViews.length;
    const view = lbViews[lbIndex];
    lbError.hidden = true;
    lbImage.hidden = false;
    lbImage.alt = view.alt;
    lbImage.src = view.src;
    lbTitle.textContent = view.title;
    lbCount.textContent = view.label + ' — ' + pad(lbIndex + 1) + ' / ' + pad(lbViews.length);
    lbDesc.textContent = view.description || '';
    // Warm the next image so stepping through feels instant.
    if (lbViews.length > 1) new Image().src = lbViews[(lbIndex + 1) % lbViews.length].src;
  }
  function openLightbox(views, index, opener) {
    if (!canDialog || !views.length) return false;
    lbViews = views;
    lbOpener = opener;
    showView(index);
    lightbox.showModal();
    lock('lightbox', true);
    $('.lightbox__close', lightbox).focus();
    return true;
  }
  lbImage.addEventListener('error', () => { lbImage.hidden = true; lbError.hidden = false; });
  $('.lightbox__close', lightbox).addEventListener('click', () => lightbox.close());
  $('.lightbox__prev', lightbox).addEventListener('click', () => showView(lbIndex - 1));
  $('.lightbox__next', lightbox).addEventListener('click', () => showView(lbIndex + 1));
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showView(lbIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showView(lbIndex + 1); }
  });
  lightbox.addEventListener('close', () => {
    lock('lightbox', false);
    lbImage.removeAttribute('src');
    if (lbOpener) lbOpener.focus({ preventScroll: true });
  });
  let touchStart = null;
  lightbox.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  lightbox.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) showView(lbIndex + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });

  const isModified = event => event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0;

  /* ---------------------------------------------------------------------
     Gallery: filters and enlarge
     ------------------------------------------------------------------- */
  const filters = $('.gallery__filters');
  const works = $$('.work');
  const workGrid = $('.work-grid');
  const galleryCount = $('.gallery__count');
  let activeWorks = works;

  filters.hidden = false;
  filters.addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    const filter = button.dataset.filter;
    $$('button', filters).forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    works.forEach(work => { work.hidden = filter !== 'all' && work.dataset.category !== filter; });
    activeWorks = works.filter(work => !work.hidden);
    // Filtered results are shown immediately rather than waiting to reveal.
    activeWorks.forEach(work => work.classList.add('is-visible'));
    galleryCount.textContent = activeWorks.length + (activeWorks.length === 1 ? ' view' : ' views');
    workGrid.classList.toggle('is-filtered', filter !== 'all');
  });

  workGrid.addEventListener('click', event => {
    const link = event.target.closest('.work__image');
    if (!link || isModified(event)) return;
    const links = activeWorks.map(work => $('.work__image', work));
    const views = links.map(a => {
      const img = $('img', a);
      return { src: a.getAttribute('href'), title: a.dataset.title, label: a.dataset.label, alt: img.alt, description: img.alt };
    });
    if (openLightbox(views, links.indexOf(link), link)) event.preventDefault();
  });

  /* ---------------------------------------------------------------------
     Project viewer: a full project page rendered from projects.js,
     addressable as #project/<slug> so it can be shared and bookmarked.
     ------------------------------------------------------------------- */
  const projects = window.portfolioProjects || {};
  const order = window.portfolioProjectOrder || [];
  const pv = $('.project-view');
  const pvTitle = $('.pv__title', pv);
  let current = null;
  let pvOpener = null;
  let pushedHistory = false;
  let closingFromHistory = false;

  const slugFromHash = () => {
    const match = /^#project\/([\w-]+)$/.exec(window.location.hash);
    return match && projects[match[1]] ? match[1] : null;
  };
  const splitCategory = category => {
    const [sector, type] = category.split('/').map(part => part.trim());
    return { sector, type };
  };
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  function projectViews(project) {
    return project.images.map((img, i) => ({
      src: img.href,
      title: project.title,
      label: project.category,
      alt: img.alt,
      description: img.alt,
      index: i
    }));
  }

  function imageButton(project, i, eager) {
    const img = project.images[i];
    const button = el('button', 'pv__img');
    button.type = 'button';
    button.dataset.index = i;
    button.setAttribute('aria-label', 'Enlarge view ' + (i + 1) + ' of ' + project.images.length + ': ' + img.alt);
    const image = el('img');
    image.src = img.href;
    image.alt = '';
    image.width = 1800;
    image.height = 1005;
    image.decoding = 'async';
    if (!eager) image.loading = 'lazy';
    button.append(image);
    return button;
  }

  function renderProject(project) {
    const total = order.length;
    const { sector, type } = splitCategory(project.category);
    $('.pv__count', pv).textContent = 'Project ' + pad(project.index + 1) + ' / ' + pad(total);
    $('.pv__category', pv).textContent = project.category;
    pvTitle.textContent = project.title;
    $('.pv__desc', pv).textContent = project.description;

    const hero = $('.pv__hero', pv);
    hero.replaceChildren(imageButton(project, 0, true));

    const meta = $('.pv__meta', pv);
    meta.replaceChildren();
    [['Project', pad(project.index + 1)], ['Sector', sector], ['Type', type], ['Views', pad(project.images.length)]]
      .filter(([, value]) => value)
      .forEach(([term, value]) => {
        const row = el('div');
        row.append(el('dt', null, term), el('dd', null, value));
        meta.append(row);
      });

    // Editorial rhythm: one full-width view, then a pair, repeated.
    const sequence = $('.pv__sequence', pv);
    sequence.replaceChildren();
    const rest = project.images.length - 1;
    for (let n = 0; n < rest; n++) {
      const i = n + 1;
      const full = n % 3 === 0 || (n % 3 === 1 && n === rest - 1);
      const figure = el('figure', 'pv__item' + (full ? ' pv__item--full' : ''));
      figure.append(imageButton(project, i, false), el('figcaption', null, pad(i + 1) + ' / ' + pad(project.images.length)));
      sequence.append(figure);
    }

    const prev = order[(project.index - 1 + total) % total];
    const next = order[(project.index + 1) % total];
    const prevBtn = $('.pv__prev', pv);
    const nextBtn = $('.pv__next', pv);
    $('.pv__name', prevBtn).textContent = prev.title;
    $('.pv__name', nextBtn).textContent = next.title;
    prevBtn.dataset.slug = prev.slug;
    nextBtn.dataset.slug = next.slug;

    current = project;
    pv.scrollTop = 0;
    document.title = project.title + ' — Alaa Masri';
  }

  const baseTitle = document.title;

  // Sticky panels report their stuck position, so measure each one unstuck.
  function scrollToPanel(item) {
    const previous = item.style.position;
    item.style.position = 'relative';
    const top = item.getBoundingClientRect().top + window.scrollY;
    item.style.position = previous;
    window.scrollTo({ top, behavior: 'instant' });
  }

  function showProject(slug) {
    const project = projects[slug];
    if (!project) return;
    renderProject(project);
    if (!pv.open) {
      pv.showModal();
      lock('project', true);
    }
    pvTitle.setAttribute('tabindex', '-1');
    pvTitle.focus({ preventScroll: true });
  }

  function openProject(slug, opener) {
    if (typeof pv.showModal !== 'function' || !projects[slug]) return false;
    pvOpener = opener || null;
    const hash = '#project/' + slug;
    if (window.location.hash !== hash) {
      history.pushState({ project: slug }, '', hash);
      pushedHistory = true;
    }
    showProject(slug);
    return true;
  }

  function switchProject(slug) {
    history.replaceState({ project: slug }, '', '#project/' + slug);
    showProject(slug);
  }

  pv.addEventListener('close', () => {
    lock('project', false);
    document.title = baseTitle;
    const fromHistory = closingFromHistory;
    closingFromHistory = false;
    if (!fromHistory && slugFromHash()) {
      if (pushedHistory) history.back();
      else history.replaceState(null, '', window.location.pathname + window.location.search + '#projects');
    }
    pushedHistory = false;
    // Return focus to the card of the project last viewed.
    const card = current && $('.project__link[data-project="' + current.slug + '"]');
    const target = card || pvOpener;
    if (target) {
      target.focus({ preventScroll: true });
      if (card && card !== pvOpener) scrollToPanel(card.closest('.project'));
    }
  });

  $('[data-close]', pv).addEventListener('click', () => pv.close());
  $('.pv__prev', pv).addEventListener('click', event => switchProject(event.currentTarget.dataset.slug));
  $('.pv__next', pv).addEventListener('click', event => switchProject(event.currentTarget.dataset.slug));
  pv.addEventListener('click', event => {
    const button = event.target.closest('.pv__img');
    if (!button || !current) return;
    openLightbox(projectViews(current), Number(button.dataset.index), button);
  });

  $('.project-list').addEventListener('click', event => {
    const link = event.target.closest('[data-project]');
    if (!link || isModified(event)) return;
    if (openProject(link.dataset.project, link)) event.preventDefault();
  });

  window.addEventListener('popstate', () => {
    const slug = slugFromHash();
    if (slug) {
      pushedHistory = false;
      showProject(slug);
    } else if (pv.open) {
      closingFromHistory = true;
      if (lightbox.open) lightbox.close();
      pv.close();
    }
  });

  const initial = slugFromHash();
  if (initial) {
    pvOpener = $('.project__link[data-project="' + initial + '"]');
    showProject(initial);
  }

  /* ---------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------- */
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
