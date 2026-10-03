import Swiper from 'swiper';
import { A11y, Navigation, Scrollbar } from 'swiper/modules';
import 'swiper/css/scrollbar';
import type Lenis from 'lenis';

export class CatalogPage {
  static init(lenis: Lenis | null = null): void {
    if (document.body.dataset.page !== 'catalog') return;
    this.initNewProducts();
    this.initSearchTrigger();
    this.initNavigation(lenis);
    this.initFilters(lenis);
  }

  private static initNewProducts(): void {
    const section = document.querySelector<HTMLElement>(
      '[data-catalog-new-slider]',
    );
    const slider = section?.querySelector<HTMLElement>('.swiper');
    if (!section || !slider) return;
    new Swiper(slider, {
      modules: [Navigation, Scrollbar, A11y],
      slidesPerView: 'auto',
      navigation: {
        prevEl: section.querySelector<HTMLButtonElement>(
          '[data-swiper-button-prev]',
        ),
        nextEl: section.querySelector<HTMLButtonElement>(
          '[data-swiper-button-next]',
        ),
      },
      scrollbar: {
        el: section.querySelector<HTMLElement>('.swiper-scrollbar'),
        draggable: true,
      },
      a11y: {
        prevSlideMessage: 'Предыдущие новинки',
        nextSlideMessage: 'Следующие новинки',
        slideLabelMessage: '{{index}} из {{slidesLength}}',
      },
    });
  }

  private static initSearchTrigger(): void {
    const input = document.querySelector<HTMLInputElement>('.catalog-search__input');
    if (!input) return;
    document
      .querySelector<HTMLButtonElement>(
        '.site-header__icon-button[aria-label="Поиск"]',
      )
      ?.addEventListener('click', () => {
        input.scrollIntoView({ block: 'center', behavior: 'smooth' });
        input.focus({ preventScroll: true });
      });
  }

  private static initNavigation(lenis: Lenis | null): void {
    const nav = document.querySelector<HTMLElement>(
      '[data-catalog-navigation]',
    );
    const toggle = nav?.querySelector<HTMLButtonElement>(
      '.catalog-navigation__toggle',
    );
    const collapse = nav?.querySelector<HTMLElement>(
      '.catalog-navigation__collapse',
    );
    const label = nav?.querySelector<HTMLElement>(
      '[data-catalog-current-section]',
    );
    if (!nav || !toggle || !collapse || !label) return;
    const mobile = window.matchMedia('(max-width: 576px)');
    const links = [
      ...nav.querySelectorAll<HTMLAnchorElement>(
        '.catalog-navigation__links a',
      ),
    ];
    const sections = links
      .map((link) => document.querySelector<HTMLElement>(link.hash))
      .filter((section): section is HTMLElement => Boolean(section));
    const setOpen = (open: boolean) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      collapse.inert = mobile.matches && !open;
    };
    toggle.addEventListener('click', () =>
      setOpen(!nav.classList.contains('is-open')),
    );
    const update = () => {
      const header = document.querySelector<HTMLElement>('.site-header');
      const offset = mobile.matches
        ? toggle.offsetHeight
        : (header?.offsetHeight ?? 0) + nav.offsetHeight;
      const visible = Boolean(
        sections[0] && sections[0].getBoundingClientRect().top <= offset + 30,
      );
      nav.classList.toggle('is-visible', visible);
      nav.inert = !visible;
      document.body.classList.toggle('has-catalog-navigation', visible);
      // The desktop design keeps the main header visible above the section navigation.
      if (!mobile.matches && header) header.inert = false;
      let current = 0;
      sections.forEach((section, index) => {
        if (section.getBoundingClientRect().top <= offset + 30) current = index;
      });
      links.forEach((link, index) => {
        if (index === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      label.textContent = links[current]?.textContent ?? '';
      if (!visible) setOpen(false);
    };
    links.forEach((link) =>
      link.addEventListener('click', (event) => {
        const section = document.querySelector<HTMLElement>(link.hash);
        if (!section) return;
        event.preventDefault();
        setOpen(false);
        const offset = mobile.matches
          ? toggle.offsetHeight + 15
          : (document.querySelector<HTMLElement>('.site-header')
              ?.offsetHeight ?? 0) +
            nav.offsetHeight +
            15;
        history.replaceState(null, '', link.hash);
        if (lenis) lenis.scrollTo(section, { offset: -offset });
        else
          window.scrollTo({
            top: window.scrollY + section.getBoundingClientRect().top - offset,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
              .matches
              ? 'instant'
              : 'smooth',
          });
      }),
    );
    document.addEventListener('pointerdown', (event) => {
      if (event.target instanceof Node && !nav.contains(event.target))
        setOpen(false);
    });
    nav.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.focus();
      }
    });
    mobile.addEventListener('change', () => {
      setOpen(false);
      update();
    });
    let frame = 0;
    window.addEventListener(
      'scroll',
      () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          update();
        });
      },
      { passive: true },
    );
    window.addEventListener('resize', update);
    setOpen(false);
    update();
  }

  private static initFilters(lenis: Lenis | null): void {
    const panel = document.querySelector<HTMLElement>('[data-filters-panel]');
    const form = panel?.querySelector<HTMLFormElement>('form');
    const opener = document.querySelector<HTMLButtonElement>(
      '[data-filters-open]',
    );
    const closer = panel?.querySelector<HTMLButtonElement>(
      '[data-filters-close]',
    );
    if (!panel || !form || !opener || !closer) return;
    const mobile = window.matchMedia('(max-width: 576px)');
    const filters = [...form.querySelectorAll<HTMLElement>('[data-filter]')];
    const setExpanded = (filter: HTMLElement, open: boolean) => {
      filter.classList.toggle('is-open', open);
      filter
        .querySelector('button')
        ?.setAttribute('aria-expanded', String(open));
      const content = filter.querySelector<HTMLElement>(
        '.catalog-filter__collapse',
      );
      if (content) content.inert = !open;
    };
    filters.forEach((filter) => {
      filter.querySelector('button')?.addEventListener('click', () => {
        const open = !filter.classList.contains('is-open');
        if (!mobile.matches)
          filters.forEach((item) => setExpanded(item, false));
        setExpanded(filter, open);
      });
    });
    document.addEventListener('pointerdown', (event) => {
      if (!mobile.matches && event.target instanceof Node)
        filters.forEach((filter) => {
          if (!filter.contains(event.target as Node))
            setExpanded(filter, false);
        });
    });
    const min = form.elements.namedItem('power_min') as HTMLInputElement;
    const max = form.elements.namedItem('power_max') as HTMLInputElement;
    const minRange = form.querySelector<HTMLInputElement>('[data-power-min]')!;
    const maxRange = form.querySelector<HTMLInputElement>('[data-power-max]')!;
    const rangeTrack = form.querySelector<HTMLElement>('.catalog-power__range')!;
    const syncPower = (source?: HTMLInputElement) => {
      if (source === minRange) min.value = minRange.value;
      if (source === maxRange) max.value = maxRange.value;
      const lower = Math.min(5000, Math.max(300, Number(min.value) || 300));
      const upper = Math.min(5000, Math.max(300, Number(max.value) || 5000));
      min.value = String(
        source === max || source === maxRange ? Math.min(lower, upper) : lower,
      );
      max.value = String(
        source === min || source === minRange ? Math.max(lower, upper) : upper,
      );
      minRange.value = min.value;
      maxRange.value = max.value;
      const rangeStart = Number(minRange.min);
      const rangeSpan = Number(minRange.max) - rangeStart;
      rangeTrack.style.setProperty(
        '--power-range-start',
        `${((Number(minRange.value) - rangeStart) / rangeSpan) * 100}%`,
      );
      rangeTrack.style.setProperty(
        '--power-range-end',
        `${((Number(maxRange.value) - rangeStart) / rangeSpan) * 100}%`,
      );
      min.max = max.value;
      max.min = min.value;
      minRange.setAttribute('aria-valuetext', `${min.value} Вт`);
      maxRange.setAttribute('aria-valuetext', `${max.value} Вт`);
    };
    [minRange, maxRange].forEach((range) =>
      range.addEventListener('input', () => syncPower(range)),
    );
    [min, max].forEach((input) =>
      input.addEventListener('change', () => syncPower(input)),
    );
    const params = new URLSearchParams(location.search);
    form.querySelectorAll<HTMLInputElement>('input[name]').forEach((input) => {
      if (!params.has(input.name)) return;
      if (input.type === 'checkbox')
        input.checked = params.getAll(input.name).includes(input.value);
      else input.value = params.get(input.name) ?? input.value;
    });
    form.addEventListener('reset', () => {
      requestAnimationFrame(() => {
        syncPower();
      });
    });
    form.addEventListener('submit', () => syncPower());
    syncPower();

    let previousOverflow = '';
    const inertElements = new Map<HTMLElement, boolean>();
    const close = (restoreFocus = true) => {
      if (!panel.classList.contains('is-open')) return;
      panel.classList.remove('is-open');
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
      document.documentElement.style.overflow = previousOverflow;
      inertElements.forEach((inert, element) => {
        element.inert = inert;
      });
      inertElements.clear();
      lenis?.start();
      opener.setAttribute('aria-expanded', 'false');
      if (restoreFocus) opener.focus();
    };
    opener.addEventListener('click', () => {
      panel.classList.add('is-open');
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      opener.setAttribute('aria-expanded', 'true');
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      lenis?.stop();
      // Inert siblings along the ancestor chain, leaving the modal itself interactive.
      let branch: HTMLElement = panel;
      while (branch.parentElement && branch !== document.body) {
        [...branch.parentElement.children].forEach((element) => {
          if (element instanceof HTMLElement && element !== branch) {
            inertElements.set(element, element.inert);
            element.inert = true;
          }
        });
        branch = branch.parentElement;
      }
      closer.focus();
    });
    closer.addEventListener('click', () => close());
    panel.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (mobile.matches) close();
        else {
          const opened = filters.find((filter) =>
            filter.classList.contains('is-open'),
          );
          if (opened) {
            setExpanded(opened, false);
            opened.querySelector('button')?.focus();
          }
        }
      }
      if (event.key !== 'Tab' || !panel.classList.contains('is-open')) return;
      const focusable = [
        ...panel.querySelectorAll<HTMLElement>('button, input, a[href]'),
      ].filter(
        (element) =>
          element.getClientRects().length && !element.closest('[inert]'),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    });
    mobile.addEventListener('change', () => {
      close(false);
      filters.forEach((filter) => setExpanded(filter, false));
    });
  }
}
