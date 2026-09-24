'use strict';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reduced.matches) {
  document.documentElement.classList.add('motion-ready');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.08});
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
const hero = document.querySelector('.hero');
const stage = document.querySelector('.portrait-stage');
if (window.matchMedia('(pointer: fine)').matches && !reduced.matches) {
  hero.addEventListener('pointermove', event => {
    const rect = hero.getBoundingClientRect();
    stage.style.setProperty('--mx', ((event.clientX-rect.left)/rect.width-.5)*14+'px');
    stage.style.setProperty('--my', ((event.clientY-rect.top)/rect.height-.5)*8+'px');
  });
  hero.addEventListener('pointerleave', () => {
    stage.style.setProperty('--mx','0px');
    stage.style.setProperty('--my','0px');
  });
}


// Filter and accessible full-screen image viewer.
const galleryFilters = document.querySelector('.gallery-filters');
const workCards = [...document.querySelectorAll('.work-card')];
const galleryCount = document.querySelector('.gallery-count');
const lightbox = document.querySelector('.lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxTitle = document.querySelector('#lightbox-title');
const lightboxCount = document.querySelector('#lightbox-count');
const lightboxError = document.querySelector('#lightbox-error');
let activeWorks = workCards.map(card => card.querySelector('a'));
let viewingWorks = [];
let currentWork = 0;
const asView = link => ({href:link.href,title:link.dataset.title,label:link.dataset.label,alt:link.querySelector('img').alt});
let previousOverflow = '';
let openedFrom = null;
galleryFilters.hidden = false;
galleryFilters.addEventListener('click', event => {
  const button = event.target.closest('button[data-filter]');
  if (!button) return;
  galleryFilters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed',String(item === button)));
  workCards.forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter; });
  activeWorks = workCards.filter(card => !card.hidden).map(card => card.querySelector('a'));
  galleryCount.textContent = activeWorks.length + ' selected views';
  document.querySelector('.work-grid').classList.toggle('is-filtered', button.dataset.filter !== 'all');
});
function showWork(index) {
  currentWork = (index + viewingWorks.length) % viewingWorks.length;
  const view = viewingWorks[currentWork];
  lightboxError.hidden = true;
  lightboxImage.hidden = false;
  lightboxImage.alt = view.alt;
  lightboxImage.src = view.href;
  lightboxTitle.textContent = view.title;
  document.querySelector('#lightbox-description').textContent = view.description || view.alt;
  lightboxCount.textContent = view.label + ' / ' + (currentWork + 1) + ' of ' + viewingWorks.length;
}
lightboxImage.addEventListener('error', () => { lightboxImage.hidden = true; lightboxError.hidden = false; });
document.querySelector('.work-grid').addEventListener('click', event => {
  const link = event.target.closest('.work-image');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof lightbox.showModal !== 'function') return;
  event.preventDefault();
  openedFrom = link;
  viewingWorks = activeWorks.map(asView);
  showWork(activeWorks.indexOf(link));
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  lightbox.showModal();
  lightbox.querySelector('.lightbox-close').focus();
});
lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
lightbox.querySelector('.lightbox-prev').addEventListener('click', () => showWork(currentWork - 1));
lightbox.querySelector('.lightbox-next').addEventListener('click', () => showWork(currentWork + 1));
lightbox.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') {event.preventDefault(); showWork(currentWork - 1);}
  if (event.key === 'ArrowRight') {event.preventDefault(); showWork(currentWork + 1);}
});
lightbox.addEventListener('close', () => {document.body.style.overflow = previousOverflow; openedFrom?.focus({preventScroll:true});});
let touchStart = null;
lightboxImage.addEventListener('touchstart', event => {touchStart = event.touches.length === 1 ? {x:event.touches[0].clientX,y:event.touches[0].clientY} : null;}, {passive:true});
lightboxImage.addEventListener('touchend', event => {
  if (!touchStart || !event.changedTouches.length) return;
  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) showWork(currentWork + (dx < 0 ? 1 : -1));
  touchStart = null;
}, {passive:true});

// Each project opens its own sequence, independent of gallery filters.
document.querySelector('.project-grid').addEventListener('click', event => {
 const link = event.target.closest('[data-project]');
 if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof lightbox.showModal !== 'function') return;
 const project = window.portfolioProjects?.[link.dataset.project];
 if (!project?.images?.length) return;
 event.preventDefault();
 openedFrom = link;
 viewingWorks = project.images;
 showWork(0);
 previousOverflow = document.body.style.overflow;
 document.body.style.overflow = 'hidden';
 lightbox.showModal();
 lightbox.querySelector('.lightbox-close').focus();
});
