import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'lenis/dist/lenis.css';
import 'swiper/css';
import '../styles/main.scss';
import { CustomSelect } from './components/CustomSelect';
import { FooterAccordions } from './components/FooterAccordions';
import { HeroVideo } from './components/HeroVideo';
import { MaterialsTabs } from './components/MaterialsTabs';
import { ProductionStories } from './components/ProductionStories';
import { SiteMenu } from './components/SiteMenu';
import { SmoothScroll } from './components/SmoothScroll';

const page = document.body.dataset.page;

if (page) {
  document.documentElement.dataset.page = page;
}

CustomSelect.initAll();
FooterAccordions.initAll();
SmoothScroll.init();
HeroVideo.initAll();
MaterialsTabs.initAll();
ProductionStories.initAll();
SiteMenu.initAll();

document.querySelectorAll<HTMLElement>('[data-electronic-catalogs-slider]').forEach((section) => {
  const swiperElement = section.querySelector<HTMLElement>('.swiper');
  const prevEl = section.querySelector<HTMLButtonElement>('[data-swiper-button-prev]');
  const nextEl = section.querySelector<HTMLButtonElement>('[data-swiper-button-next]');

  if (!swiperElement || !prevEl || !nextEl) return;

  new Swiper(swiperElement, {
    modules: [Navigation],
    slidesPerView: 'auto',
    watchOverflow: false,
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

  const updateHeader = () => {
    const isOverHomeIntro = Boolean(
      homeIntro && homeIntro.getBoundingClientRect().bottom > header.offsetHeight,
    );

    header.classList.toggle('is-scrolled', window.scrollY > 0 && !isOverHomeIntro);
    frameId = 0;
  };

  const requestHeaderUpdate = () => {
    if (frameId) return;

    frameId = window.requestAnimationFrame(updateHeader);
  };

  updateHeader();
  window.addEventListener('scroll', requestHeaderUpdate, { passive: true });
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
  });

  mobileMedia.addEventListener('change', (event) => {
    if (!event.matches) closeAllItems();
  });
});
