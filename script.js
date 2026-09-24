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
     Header: solid background once scrolled, hides on scroll down
     ------------------------------------------------------------------- */
  const header = $('[data-header]');
  const nav = $('#site-nav');
  const toggle = $('.menu-toggle');
  let lastY = window.scrollY;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const menuOpen = nav.classList.contains('is-open');
    header.classList.toggle('is-scrolled', y > 24);
    if (!menuOpen) header.classList.toggle('is-hidden', y > lastY && y > 480);
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  // Keyboard users tabbing into the header should always see it.
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  /* ---------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------- */
  const outside = [$('main'), $('.site-footer')];
  const menuQuery = window.matchMedia('(max-width: 900px)');

  function setMenu(open, { restoreFocus = true } = {}) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    $('.menu-toggle__label', toggle).textContent = open ? 'Close' : 'Menu';
    outside.forEach(el => { if (el) el.inert = open; });
    lock('menu', open);
    if (open) {
      header.classList.remove('is-hidden');
      $('a', nav).focus();
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
  menuQuery.addEventListener('change', () => {
    if (!menuQuery.matches && nav.classList.contains('is-open')) setMenu(false, { restoreFocus: false });
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
  const revealEls = $$('[data-reveal]');
  if (motionOK) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        reveal.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealEls.forEach(el => reveal.observe(el));
  }

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
      if (card && card !== pvOpener) card.closest('.project').scrollIntoView({ block: 'center' });
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
