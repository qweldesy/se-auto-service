/* Se Auto Service — интерактив: меню, Motion-анимации, слайдер отзывов, лайтбокс */

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const header = document.getElementById('header');
const burger = document.getElementById('burger');
const menu = document.getElementById('mobile-menu');

/* ---------- год ---------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

/* ---------- шапка при скролле ---------- */
const onScroll = () => {
  header.classList.toggle('is-stuck', window.scrollY > 24);
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- мобильное меню ---------- */
let menuOpen = false;

const setMenu = (open) => {
  if (!menu || !burger) return;
  menuOpen = open;
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  burger.classList.toggle('is-open', open);
  document.body.classList.toggle('is-locked', open);

  if (open) {
    menu.hidden = false;
    if (!prefersReduced && window.motionLib) {
      window.motionLib.animate(menu, { opacity: [0, 1] }, { duration: 0.22, easing: 'ease-out' });
      window.motionLib.animate(
        menu.querySelectorAll('.mobile-nav a, .mobile-menu-foot > *'),
        { opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0px)'] },
        { delay: window.motionLib.stagger(0.045), duration: 0.42, easing: [0.22, 0.61, 0.36, 1] }
      );
    }
    const first = menu.querySelector('a');
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 60);
  } else {
    if (!prefersReduced && window.motionLib) {
      window.motionLib.animate(menu, { opacity: [1, 0] }, { duration: 0.16, easing: 'ease-in' })
        .finished.then(() => { if (!menuOpen) menu.hidden = true; })
        .catch(() => { menu.hidden = true; });
      /* страховка: панель не должна остаться поверх страницы */
      setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 400);
    } else {
      menu.hidden = true;
    }
  }
};

burger?.addEventListener('click', () => setMenu(!menuOpen));
menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuOpen) {
    setMenu(false);
    burger?.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 900 && menuOpen) setMenu(false);
});

/* ---------- Motion: появление блоков, счётчики, марки ---------- */
const revealTargets = [
  '.hero-copy > *',
  '.hero-media',
  '.facts li',
  '.section-head > *',
  '.price-card',
  '.dark-head > *',
  '.work-tags li',
  '.df-item',
  '.process-intro > *',
  '.steps li',
  '.rating-panel',
  '.review-card',
  '.shot',
  '.gallery-feature',
  '.contacts-copy > *',
  '.contacts-media',
  '.footer-grid > *',
];

(async () => {
  let motion = null;
  try {
    motion = await import('https://cdn.jsdelivr.net/npm/motion@12/+esm');
    window.motionLib = motion;
  } catch (e) {
    /* без CDN сайт остаётся полностью читаемым */
    return;
  }
  if (prefersReduced) return;

  const { inView, animate, stagger } = motion;
  const seen = new WeakSet();

  revealTargets.forEach((sel) => {
    const els = document.querySelectorAll(sel);
    els.forEach((el) => el.classList.add('js-reveal'));
  });

  revealTargets.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      inView(el, () => {
        if (seen.has(el)) return;      /* один раз: без повторных проигрываний при layout shift */
        seen.add(el);
        animate(el, { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0px)'] }, {
          duration: 0.6,
          easing: [0.22, 0.61, 0.36, 1],
        });
        el.classList.add('is-in');
      }, { margin: '0px 0px -8% 0px' });
    });
  });

  /* появление тегов работ лесенкой */
  const tags = document.querySelector('.work-tags');
  if (tags) {
    const items = tags.querySelectorAll('li');
    items.forEach((el) => el.classList.add('js-reveal'));
    inView(tags, () => {
      if (seen.has(tags)) return;
      seen.add(tags);
      animate(items, { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0px)'] }, {
        delay: stagger(0.02), duration: 0.5, easing: [0.22, 0.61, 0.36, 1],
      });
      items.forEach((el) => el.classList.add('is-in'));
    }, { margin: '0px 0px -10% 0px' });
  }

  /* бегущая строка марок */
  const track = document.getElementById('brandsTrack');
  if (track && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    track.innerHTML += track.innerHTML;
    animate(track, { transform: ['translateX(0px)', 'translateX(-50%)'] }, {
      duration: 42, easing: 'linear', repeat: Infinity,
    });
  }
})();

/* ---------- слайдер отзывов ---------- */
const slider = document.getElementById('revSlider');
const prevBtn = document.getElementById('revPrev');
const nextBtn = document.getElementById('revNext');

if (slider && prevBtn && nextBtn) {
  const step = () => {
    const card = slider.querySelector('.review-card');
    if (!card) return 320;
    const gap = parseFloat(getComputedStyle(slider).columnGap || getComputedStyle(slider).gap) || 16;
    return card.getBoundingClientRect().width + gap;
  };

  const updateBtns = () => {
    const max = slider.scrollWidth - slider.clientWidth - 2;
    prevBtn.disabled = slider.scrollLeft <= 2;
    nextBtn.disabled = slider.scrollLeft >= max;
  };

  prevBtn.addEventListener('click', () => slider.scrollBy({ left: -step(), behavior: 'smooth' }));
  nextBtn.addEventListener('click', () => slider.scrollBy({ left: step(), behavior: 'smooth' }));
  slider.addEventListener('scroll', updateBtns, { passive: true });
  window.addEventListener('resize', updateBtns);
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); slider.scrollBy({ left: step(), behavior: 'smooth' }); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); slider.scrollBy({ left: -step(), behavior: 'smooth' }); }
  });
  updateBtns();
}

/* ---------- лайтбокс ---------- */
const gallery = document.getElementById('galleryGrid');
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbCap = document.getElementById('lbCap');
const lbClose = document.getElementById('lbClose');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');

if (gallery && lb) {
  const shots = [...document.querySelectorAll('#gallery .gallery-feature, #galleryGrid .shot')];
  let idx = 0;

  const show = (i) => {
    idx = (i + shots.length) % shots.length;
    const shot = shots[idx];
    const img = shot.querySelector('img');
    lbImg.src = shot.dataset.full || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = img.alt;
  };

  shots.forEach((shot, i) => {
    shot.addEventListener('click', () => {
      show(i);
      lb.showModal();
    });
  });

  lbClose.addEventListener('click', () => lb.close());
  lbPrev.addEventListener('click', () => show(idx - 1));
  lbNext.addEventListener('click', () => show(idx + 1));
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
  });
  lb.addEventListener('click', (e) => {
    if (e.target === lb) lb.close();
  });
}

/* ---------- активная ссылка в навигации ---------- */
const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.nav a')];
if ('IntersectionObserver' in window && sections.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));
}
