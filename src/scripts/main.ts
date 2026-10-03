import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'lenis/dist/lenis.css';
import 'swiper/css';
import '../styles/main.scss';
import { CatalogPage } from './components/CatalogPage';
import { CustomSelect } from './components/CustomSelect';
import { FooterAccordions } from './components/FooterAccordions';
import { HeroVideo } from './components/HeroVideo';
import { MaterialsTabs } from './components/MaterialsTabs';
import { PageMotion } from './components/PageMotion';
import { PagePreloader } from './components/PagePreloader';
import { ProductionStories } from './components/ProductionStories';
import { ProjectRequestForm } from './components/ProjectRequestForm';
import { SiteMenu } from './components/SiteMenu';
import { SmoothScroll } from './components/SmoothScroll';

const page = document.body.dataset.page;

if (page) {
  document.documentElement.dataset.page = page;
}

CustomSelect.initAll();
FooterAccordions.initAll();
const smoothScroll = SmoothScroll.init();
PagePreloader.initAll();
PageMotion.init(smoothScroll?.lenis ?? null);
HeroVideo.initAll();
MaterialsTabs.initAll();
ProductionStories.initAll();
ProjectRequestForm.initAll();
SiteMenu.initAll();
CatalogPage.init(smoothScroll?.lenis ?? null);

document.querySelectorAll<HTMLElement>('[data-electronic-catalogs-slider]').forEach((section) => {
  const swiperElement = section.querySelector<HTMLElement>('.swiper');
  const prevEl = section.querySelector<HTMLButtonElement>('[data-swiper-button-prev]');
  const nextEl = section.querySelector<HTMLButtonElement>('[data-swiper-button-next]');

  if (!swiperElement || !prevEl || !nextEl) return;

  new Swiper(swiperElement, {
    modules: [Navigation],
    slidesPerView: 'auto',
    watchOverflow: true,
    navigation: { prevEl, nextEl },
  });
});

document.querySelectorAll<HTMLElement>('[data-popular-series-slider]').forEach((section) => {
  const swiperElement = section.querySelector<HTMLElement>('.swiper');
  const prevEl = section.querySelector<HTMLButtonElement>('[data-swiper-button-prev]');
  const nextEl = section.querySelector<HTMLButtonElement>('[data-swiper-button-next]');

  if (!swiperElement || !prevEl || !nextEl) return;

  const desktopMedia = window.matchMedia('(min-width: 577px)');
  let swiper: Swiper | null = null;

  const syncSlider = () => {
    if (desktopMedia.matches && !swiper) {
      swiper = new Swiper(swiperElement, {
        modules: [Navigation],
        slidesPerView: 'auto',
        watchOverflow: false,
        navigation: { prevEl, nextEl },
      });
    } else if (!desktopMedia.matches && swiper) {
      swiper.destroy(true, true);
      swiper = null;
    }
  };

  syncSlider();
  desktopMedia.addEventListener('change', syncSlider);
});

document.querySelectorAll<HTMLElement>('.site-header').forEach((header) => {
  const homeIntro = document.querySelector<HTMLElement>('.home-intro');
  let frameId = 0;
  let lastScrollY = window.scrollY;

  const setHeaderHidden = (isHidden: boolean) => {
    const catalogDesktop = page === 'catalog' && window.innerWidth > 576;
    const catalogNavigationVisible = page === 'catalog' && document.body.classList.contains('has-catalog-navigation');
    const hidden = !catalogDesktop && (isHidden || catalogNavigationVisible);
    header.classList.toggle('is-hidden', hidden);
    header.inert = hidden;
  };

  const updateHeader = () => {
    frameId = 0;

    if (document.documentElement.classList.contains('is-menu-open')) return;

    const scrollY = window.scrollY;
    const hasScrolled = scrollY > 0;
    const isOverHomeIntro = Boolean(homeIntro && homeIntro.getBoundingClientRect().bottom > 0);
    const scrollDelta = scrollY - lastScrollY;

    if (!hasScrolled || (!isOverHomeIntro && scrollY <= header.offsetHeight)) {
      setHeaderHidden(false);
    } else if (Math.abs(scrollDelta) >= 6) {
      setHeaderHidden(scrollDelta > 0);
    }

    const isTransparentOverHomeIntro = isOverHomeIntro && (
      header.classList.contains('is-hidden') || scrollDelta > 0
    );
    const isScrolled = hasScrolled && !isTransparentOverHomeIntro;
    header.classList.toggle('is-scrolled', isScrolled);

    if (Math.abs(scrollDelta) >= 6 || !hasScrolled) lastScrollY = scrollY;
  };

  const requestHeaderUpdate = () => {
    if (frameId) return;

    frameId = window.requestAnimationFrame(updateHeader);
  };

  updateHeader();
  window.addEventListener('scroll', requestHeaderUpdate, { passive: true });
  window.addEventListener('site-menu:closed', () => {
    lastScrollY = window.scrollY;
    updateHeader();
  });
});

if (page === 'ui-kit') {
  const sections = [...document.querySelectorAll<HTMLElement>('[data-ui-kit-section]')];
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.ui-kit-nav__link')];
  const linksById = new Map(links.map((link) => [link.hash.slice(1), link]));

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

      if (!visible) return;

      links.forEach((link) => link.classList.remove('is-active'));
      linksById.get(visible.target.id)?.classList.add('is-active');
    },
    { rootMargin: '-15% 0px -70% 0px' },
  );

  sections.forEach((section) => sectionObserver.observe(section));

}

document.querySelectorAll<HTMLElement>('[data-file-upload]').forEach((upload) => {
  const input = upload.querySelector<HTMLInputElement>('[data-file-upload-input]');
  const trigger = upload.querySelector<HTMLButtonElement>('[data-file-upload-trigger]');
  const clear = upload.querySelector<HTMLButtonElement>('[data-file-upload-clear]');
  const name = upload.querySelector<HTMLElement>('[data-file-upload-name]');

  if (!input || !trigger || !clear || !name) return;

  const placeholder = 'Выберите файл';

  const setFileName = (fileName?: string) => {
    const hasFile = Boolean(fileName);
    upload.classList.toggle('file-upload--has-file', hasFile);
    name.textContent = fileName || placeholder;
    clear.hidden = !hasFile;
    trigger.setAttribute('aria-label', hasFile ? `Заменить файл ${fileName}` : placeholder);
  };

  trigger.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
    setFileName(input.files?.[0]?.name);
  });

  clear.addEventListener('click', () => {
    input.value = '';
    setFileName();
    trigger.focus();
  });

  setFileName(input.files?.[0]?.name || upload.dataset.initialFile);
});

document.querySelectorAll<HTMLElement>('.advantages-section').forEach((section) => {
  const items = [...section.querySelectorAll<HTMLElement>('.advantages-section__item')];
  const mobileMedia = window.matchMedia('(max-width: 576px)');

  const closeAllItems = () => {
    items.forEach((item) => {
      item.classList.remove('is-open');
      item
        .querySelector<HTMLButtonElement>('.advantages-section__trigger')
        ?.setAttribute('aria-expanded', 'false');
    });
  };

  items.forEach((item) => {
    const trigger = item.querySelector<HTMLButtonElement>('.advantages-section__trigger');

    if (!trigger) return;

    trigger.addEventListener('click', () => {
      if (!mobileMedia.matches) return;

      const willOpen = !item.classList.contains('is-open');

      closeAllItems();

      if (willOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    item.addEventListener('focusin', (event) => {
      if (!mobileMedia.matches || !(event.target instanceof HTMLAnchorElement)) return;

      closeAllItems();
      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    });
  });

  mobileMedia.addEventListener('change', (event) => {
    if (!event.matches) closeAllItems();
  });
});
