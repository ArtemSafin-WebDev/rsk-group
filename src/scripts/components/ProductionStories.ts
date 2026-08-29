import Swiper from 'swiper';
import { Autoplay, Navigation } from 'swiper/modules';

const AUTOPLAY_DELAY = 5000;

type StoryPanel = {
  id: string;
  element: HTMLElement;
  swiper: Swiper;
};

/** Controls the production tabs and their independent Instagram-style story sliders. */
export class ProductionStories {
  private readonly root: HTMLElement;
  private readonly tabs: HTMLButtonElement[];
  private readonly select?: HTMLSelectElement;
  private readonly panels = new Map<string, StoryPanel>();
  private readonly reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly desktopMedia = window.matchMedia('(min-width: 577px)');
  private activeId = '';
  private isSectionVisible = false;

  static initAll(scope: ParentNode = document): ProductionStories[] {
    return [...scope.querySelectorAll<HTMLElement>('[data-production-stories]')].map(
      (root) => new ProductionStories(root),
    );
  }

  constructor(root: HTMLElement) {
    this.root = root;
    this.tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-stories-tab]')];
    this.select = root.querySelector<HTMLSelectElement>('[data-stories-select]') ?? undefined;

    this.createSliders();
    this.bindEvents();
    this.observeHeader();

    const initialId = this.select?.value || this.tabs[0]?.dataset.storiesTab || '';
    if (initialId) this.activate(initialId, false, false);
  }

  private createSliders(): void {
    this.root.querySelectorAll<HTMLElement>('[data-stories-panel]').forEach((panel) => {
      const id = panel.dataset.storiesPanel;
      const swiperElement = panel.querySelector<HTMLElement>('[data-stories-swiper]');
      const prevEl = panel.querySelector<HTMLButtonElement>('[data-swiper-button-prev]');
      const nextEl = panel.querySelector<HTMLButtonElement>('[data-swiper-button-next]');

      if (!id || !swiperElement || !prevEl || !nextEl) return;

      const swiper = new Swiper(swiperElement, {
        modules: [Autoplay, Navigation],
        speed: 700,
        rewind: true,
        allowTouchMove: true,
        navigation: { prevEl, nextEl },
        autoplay: this.reduceMotion
          ? false
          : {
              delay: AUTOPLAY_DELAY,
              disableOnInteraction: false,
              pauseOnMouseEnter: false,
              stopOnLastSlide: true,
            },
        on: {
          init: () => this.resetProgress(id),
          slideChange: (instance) => {
            if (id === this.activeId) this.syncProgress(id, instance, 0);
          },
          autoplayTimeLeft: (instance, timeLeft, progress) => {
            if (id !== this.activeId) return;

            this.syncProgress(id, instance, 1 - progress);

            if (this.desktopMedia.matches && instance.isEnd && timeLeft <= 16) {
              this.activateAdjacentTab(id, 1);
            }
          },
        },
      });

      swiper.autoplay?.stop();
      this.panels.set(id, { id, element: panel, swiper });

      nextEl.addEventListener(
        'click',
        (event) => {
          if (!this.desktopMedia.matches || !swiper.isEnd) return;

          event.preventDefault();
          event.stopImmediatePropagation();
          this.activateAdjacentTab(id, 1);
        },
        { capture: true },
      );

      prevEl.addEventListener(
        'click',
        (event) => {
          if (!this.desktopMedia.matches || !swiper.isBeginning) return;

          event.preventDefault();
          event.stopImmediatePropagation();
          this.activateAdjacentTab(id, -1, true);
        },
        { capture: true },
      );
    });
  }

  private bindEvents(): void {
    this.root.addEventListener(
      'click',
      (event) => {
        if (!(event instanceof MouseEvent) || !(event.target instanceof Element)) return;

        const group = event.target.closest<HTMLElement>('[data-stories-progress]');
        const id = group?.dataset.storiesProgress;
        if (!group || !id || !this.root.contains(group)) return;

        const tracks = [...group.querySelectorAll<HTMLElement>('[data-story-progress]')];
        if (!tracks.length) return;

        const clickedTrack = event.target.closest<HTMLElement>('[data-story-progress]');
        let index = clickedTrack ? tracks.indexOf(clickedTrack) : -1;

        if (index < 0) {
          const { left, width } = group.getBoundingClientRect();
          const relativePosition = Math.min(0.999, Math.max(0, (event.clientX - left) / width));
          index = Math.floor(relativePosition * tracks.length);
        }

        event.preventDefault();
        event.stopPropagation();
        this.goToStory(id, index);
      },
      { capture: true },
    );

    this.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const id = tab.dataset.storiesTab;
        if (id) this.activate(id);
      });

      tab.addEventListener('keydown', (event) => this.handleTabKeydown(event, tab));
    });

    this.select?.addEventListener('change', () => {
      if (this.select?.value && this.select.value !== this.activeId) {
        this.activate(this.select.value, false);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (this.reduceMotion) return;

      const activeSwiper = this.panels.get(this.activeId)?.swiper;
      if (!activeSwiper?.autoplay) return;

      if (document.hidden || !this.isSectionVisible) activeSwiper.autoplay.stop();
      else activeSwiper.autoplay.start();
    });
  }

  private observeHeader(): void {
    const header = document.querySelector<HTMLElement>('.site-header');

    const observer = new IntersectionObserver(
      ([entry]) => {
        this.isSectionVisible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.15);
        header?.classList.toggle('is-hidden-on-production-stories', this.isSectionVisible);

        if (this.reduceMotion) return;

        const activeSwiper = this.panels.get(this.activeId)?.swiper;
        if (!activeSwiper?.autoplay) return;

        if (this.isSectionVisible && !document.hidden) activeSwiper.autoplay.start();
        else activeSwiper.autoplay.stop();
      },
      { threshold: [0, 0.15] },
    );

    observer.observe(this.root);
  }

  private handleTabKeydown(event: KeyboardEvent, currentTab: HTMLButtonElement): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const currentIndex = this.tabs.indexOf(currentTab);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % this.tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = this.tabs.length - 1;

    const nextTab = this.tabs[nextIndex];
    const id = nextTab?.dataset.storiesTab;
    if (!nextTab || !id) return;

    this.activate(id);
    nextTab.focus();
  }

  private activate(id: string, syncSelect = true, startAutoplay = true): void {
    const nextPanel = this.panels.get(id);
    if (!nextPanel) return;
    if (id === this.activeId) return;

    this.activeId = id;

    this.panels.forEach(({ element, swiper }, panelId) => {
      const isActive = panelId === id;
      element.classList.toggle('is-active', isActive);
      element.setAttribute('aria-hidden', String(!isActive));

      if (!isActive) {
        swiper.autoplay?.stop();
        swiper.slideTo(0, 0, false);
        this.resetProgress(panelId);
      }
    });

    this.tabs.forEach((tab) => {
      const isActive = tab.dataset.storiesTab === id;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    if (syncSelect && this.select && this.select.value !== id) {
      this.select.value = id;
      this.select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    nextPanel.swiper.autoplay?.stop();
    nextPanel.swiper.slideTo(0, 0, false);
    nextPanel.swiper.update();
    this.resetProgress(id);

    if (startAutoplay && this.isSectionVisible && !this.reduceMotion) {
      nextPanel.swiper.autoplay?.start();
    }
  }

  private goToStory(id: string, index: number): void {
    const panel = this.panels.get(id);
    if (!panel) return;

    if (id !== this.activeId) this.activate(id, true, false);

    panel.swiper.autoplay?.stop();
    panel.swiper.slideTo(index);
    this.syncProgress(id, panel.swiper, 0);

    if (this.isSectionVisible && !this.reduceMotion) panel.swiper.autoplay?.start();
  }

  private activateAdjacentTab(id: string, direction: 1 | -1, useLastStory = false): void {
    const currentIndex = this.tabs.findIndex((tab) => tab.dataset.storiesTab === id);
    if (currentIndex < 0) return;

    const nextIndex = (currentIndex + direction + this.tabs.length) % this.tabs.length;
    const nextId = this.tabs[nextIndex]?.dataset.storiesTab;
    if (!nextId) return;

    if (!useLastStory) {
      this.activate(nextId);
      return;
    }

    const nextPanel = this.panels.get(nextId);
    if (!nextPanel) return;

    this.activate(nextId, true, false);
    nextPanel.swiper.slideTo(nextPanel.swiper.slides.length - 1);
    this.syncProgress(nextId, nextPanel.swiper, 0);

    if (this.isSectionVisible && !this.reduceMotion) nextPanel.swiper.autoplay?.start();
  }

  private syncProgress(id: string, swiper: Swiper, activeProgress: number): void {
    const currentIndex = swiper.realIndex;
    const clampedProgress = Math.min(1, Math.max(0, activeProgress));

    this.root
      .querySelectorAll<HTMLElement>(`[data-stories-progress="${id}"]`)
      .forEach((group) => {
        group.querySelectorAll<HTMLElement>('[data-story-progress]').forEach((track, index) => {
          const progress = index < currentIndex ? 1 : index === currentIndex ? clampedProgress : 0;
          track.style.setProperty('--story-progress', `${progress * 100}%`);
        });
      });
  }

  private resetProgress(id: string): void {
    this.root
      .querySelectorAll<HTMLElement>(`[data-stories-progress="${id}"] [data-story-progress]`)
      .forEach((track) => track.style.setProperty('--story-progress', '0%'));
  }
}
