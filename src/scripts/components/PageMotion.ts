import type Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const CARD_GROUP_SELECTORS = [
  '.solutions-section__cards > .solution-card',
  '.catalog-section__cards > .direction-card',
  '.category-grid-section__grid > .category-card',
  '.subcategory-products__grid > .product-card',
  '.advantages-section__list > .advantages-section__item',
  '.materials-section__list:not([hidden]) .material-card',
  '.popular-series__slider .swiper-slide',
  '.electronic-catalogs__slider .swiper-slide',
  '.subcategory-description__list > .subcategory-description__item',
];

const HEADER_GROUP_SELECTORS = [
  '.solutions-section__header',
  '.catalog-section__header',
  '.materials-section__header',
  '.category-grid-section__header',
  '.popular-series__header',
  '.electronic-catalogs__header',
];

const SPLIT_REVEAL_SELECTORS = [
  '.company-intro-section__title',
  '.production-stories__title',
];

export class PageMotion {
  private readonly entranceTitle: HTMLElement | null;
  private readonly entranceSplit: SplitText | null;
  private readonly scrollSplits: SplitText[] = [];
  private hasStarted = false;

  constructor(lenis: Lenis | null = null) {
    ScrollTrigger.config({ ignoreMobileResize: true });
    lenis?.on('scroll', ScrollTrigger.update);

    this.entranceTitle = document.querySelector<HTMLElement>(
      '.hero-section__title, .catalog-hero__title, .subcategory-products__title',
    );
    this.entranceSplit = this.createEntranceSplit();

    this.prepareEntrance();
    this.prepareScrollGroups();
    this.waitForPageReveal();

    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  }

  private createEntranceSplit(): SplitText | null {
    if (!this.entranceTitle) return null;

    return SplitText.create(this.entranceTitle, {
      type: 'words',
      wordsClass: 'motion-word',
    });
  }

  private prepareEntrance(): void {
    const entranceCopy = this.getEntranceCopy();
    const heroMedia = document.querySelectorAll<HTMLElement>(
      '.home-intro__picture, .home-intro__video',
    );

    gsap.set('.site-header', { autoAlpha: 0, yPercent: -35 });

    if (this.entranceTitle) {
      gsap.set(this.entranceTitle, { autoAlpha: 1 });
    }

    if (this.entranceSplit) {
      gsap.set(this.entranceSplit.words, {
        autoAlpha: 0,
        rotate: 2,
        transformOrigin: 'left bottom',
        yPercent: 115,
      });
    }

    if (entranceCopy.length) {
      gsap.set(entranceCopy, { autoAlpha: 0, yPercent: 30 });
    }

    if (heroMedia.length) {
      gsap.set(heroMedia, { scale: 1.055, transformOrigin: 'center center' });
    }
  }

  private getEntranceCopy(): HTMLElement[] {
    return [
      ...document.querySelectorAll<HTMLElement>(
        [
          '.hero-section__description',
          '.hero-section__lead .button',
          '.hero-section__copyright',
          '.catalog-hero__description',
          '.catalog-hero__download',
          '.subcategory-products__summary',
        ].join(', '),
      ),
    ];
  }

  private prepareScrollGroups(): void {
    CARD_GROUP_SELECTORS.forEach((selector) => {
      const items = document.querySelectorAll<HTMLElement>(selector);

      if (!items.length) return;

      gsap.set(items, {
        autoAlpha: 0,
        yPercent: 10,
      });
    });

    HEADER_GROUP_SELECTORS.forEach((selector) => {
      const root = document.querySelector<HTMLElement>(selector);

      if (!root) return;

      gsap.set([...root.children], { autoAlpha: 0, yPercent: 35 });
    });

    gsap.set(
      document.querySelectorAll<HTMLElement>(
        '.company-intro-section__certification',
      ),
      { autoAlpha: 0, yPercent: 15 },
    );
  }

  private waitForPageReveal(): void {
    const preloader = document.querySelector<HTMLElement>('[data-page-preloader]');

    if (!preloader || preloader.hidden || preloader.classList.contains('is-hiding')) {
      void document.fonts.ready.then(this.start);
      return;
    }

    document.addEventListener('page-preloader:hiding', this.start, { once: true });
  }

  private start = (): void => {
    if (this.hasStarted) return;

    this.hasStarted = true;
    this.playEntrance();
    this.createHeaderReveals();
    this.createCardReveals();
    this.createSplitReveals();
    this.createSupportingReveals();
    this.createParallax();
    ScrollTrigger.refresh();
  };

  private playEntrance(): void {
    const entranceCopy = this.getEntranceCopy();
    const heroMedia = document.querySelectorAll<HTMLElement>(
      '.home-intro__picture, .home-intro__video',
    );
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

    timeline.to('.site-header', { autoAlpha: 1, duration: 0.7, yPercent: 0 });

    if (heroMedia.length) {
      timeline.to(heroMedia, { duration: 1.6, ease: 'power2.out', scale: 1 }, 0);
    }

    if (this.entranceSplit) {
      timeline.to(
        this.entranceSplit.words,
        {
          autoAlpha: 1,
          duration: 1,
          rotate: 0,
          stagger: 0.045,
          yPercent: 0,
        },
        0.12,
      );
    }

    if (entranceCopy.length) {
      timeline.to(
        entranceCopy,
        {
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.08,
          yPercent: 0,
        },
        0.38,
      );
    }
  }

  private createHeaderReveals(): void {
    HEADER_GROUP_SELECTORS.forEach((selector) => {
      const root = document.querySelector<HTMLElement>(selector);

      if (!root) return;

      gsap.to([...root.children], {
        autoAlpha: 1,
        duration: 0.85,
        ease: 'power3.out',
        stagger: 0.09,
        yPercent: 0,
        scrollTrigger: {
          trigger: root,
          start: 'top 84%',
          once: true,
        },
      });
    });
  }

  private createCardReveals(): void {
    CARD_GROUP_SELECTORS.forEach((selector) => {
      const items = [...document.querySelectorAll<HTMLElement>(selector)];

      if (!items.length) return;

      ScrollTrigger.batch(items, {
        batchMax: () => (window.innerWidth <= 576 ? 2 : 4),
        interval: 0.08,
        once: true,
        start: 'top 92%',
        onEnter: (batch) => {
          gsap.to(batch, {
            autoAlpha: 1,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.08,
            yPercent: 0,
          });
        },
      });
    });
  }

  private createSplitReveals(): void {
    document.querySelectorAll<HTMLElement>(SPLIT_REVEAL_SELECTORS.join(', ')).forEach((title) => {
      const split = SplitText.create(title, {
        autoSplit: true,
        type: 'lines',
        linesClass: 'motion-line',
        mask: 'lines',
        onSplit: (instance) => gsap.from(instance.lines, {
          duration: 1,
          ease: 'power3.out',
          stagger: 0.09,
          yPercent: 115,
          scrollTrigger: {
            trigger: title,
            start: 'top 84%',
            once: true,
          },
        }),
      });

      this.scrollSplits.push(split);
    });
  }

  private createSupportingReveals(): void {
    const items = document.querySelectorAll<HTMLElement>(
      '.company-intro-section__certification',
    );

    items.forEach((item) => {
      gsap.to(item, {
        autoAlpha: 1,
        duration: 0.9,
        ease: 'power3.out',
        yPercent: 0,
        scrollTrigger: {
          trigger: item,
          start: 'top 86%',
          once: true,
        },
      });
    });
  }

  private createParallax(): void {
    const requestContent = document.querySelector<HTMLElement>('.project-request__content');

    if (requestContent) {
      gsap.matchMedia().add('(min-width: 961px)', () => {
        gsap.fromTo(
          requestContent,
          { y: '8rem' },
          {
            ease: 'none',
            y: 0,
            scrollTrigger: {
              trigger: '.project-request-scene',
              start: 'top bottom',
              end: 'top 30%',
              scrub: 0.7,
            },
          },
        );
      });
    }

    const catalogBackground = document.querySelector<HTMLElement>('.catalog-hero__background img');

    if (catalogBackground) {
      gsap.fromTo(
        catalogBackground,
        { scale: 1.035, yPercent: 0 },
        {
          ease: 'none',
          scale: 1.1,
          yPercent: 5,
          scrollTrigger: {
            trigger: '.catalog-hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
          },
        },
      );
    }
  }

  static init(lenis: Lenis | null = null): PageMotion | null {
    if (
      document.body.dataset.page === 'ui-kit' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return null;
    }

    return new PageMotion(lenis);
  }
}
