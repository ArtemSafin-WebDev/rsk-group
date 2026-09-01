const MAX_VISIBLE_DURATION = 5000;
const EXIT_DURATION = 700;
const STABLE_LAYOUT_DURATION = 300;

export class PagePreloader {
  private readonly root: HTMLElement;
  private timeout = 0;
  private isDismissed = false;
  private isPageLoaded = document.readyState === 'complete';
  private isContentReady = document.body.dataset.page !== 'home';
  private isFontsReady = false;
  private settleFrame = 0;
  private lastScrollPosition = Number.NaN;
  private lastDocumentHeight = 0;
  private stableSince = 0;

  constructor(root: HTMLElement) {
    this.root = root;
    this.timeout = window.setTimeout(this.dismiss, MAX_VISIBLE_DURATION - EXIT_DURATION);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.dismiss();
      return;
    }

    document.addEventListener('hero-video:ready', this.handleContentReady, { once: true });
    document.addEventListener('hero-video:unavailable', this.handleContentReady, { once: true });
    void document.fonts.ready.then(this.handleFontsReady);

    if (this.isPageLoaded) this.requestDismiss();
    else window.addEventListener('load', this.handlePageLoad, { once: true });
  }

  private handleContentReady = (): void => {
    this.isContentReady = true;
    this.requestDismiss();
  };

  private handlePageLoad = (): void => {
    this.isPageLoaded = true;
    this.requestDismiss();
  };

  private handleFontsReady = (): void => {
    this.isFontsReady = true;
    this.requestDismiss();
  };

  private requestDismiss(): void {
    if (
      !this.isPageLoaded ||
      !this.isContentReady ||
      !this.isFontsReady ||
      this.isDismissed ||
      this.settleFrame
    ) {
      return;
    }

    this.settleFrame = window.requestAnimationFrame(this.waitForStableLayout);
  }

  private waitForStableLayout = (time: number): void => {
    this.settleFrame = 0;

    if (this.isDismissed) return;

    const scrollPosition = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;
    const positionIsStable = Math.abs(scrollPosition - this.lastScrollPosition) < 0.5;
    const heightIsStable = documentHeight === this.lastDocumentHeight;

    if (!positionIsStable || !heightIsStable) {
      this.lastScrollPosition = scrollPosition;
      this.lastDocumentHeight = documentHeight;
      this.stableSince = time;
    } else if (time - this.stableSince >= STABLE_LAYOUT_DURATION) {
      this.dismiss();
      return;
    }

    this.settleFrame = window.requestAnimationFrame(this.waitForStableLayout);
  };

  private dismiss = (): void => {
    if (this.isDismissed) return;

    this.isDismissed = true;
    window.clearTimeout(this.timeout);
    window.cancelAnimationFrame(this.settleFrame);
    this.root.classList.add('is-hiding');

    window.setTimeout(() => {
      this.root.hidden = true;
    }, EXIT_DURATION);
  };

  static initAll(): PagePreloader[] {
    return [...document.querySelectorAll<HTMLElement>('[data-page-preloader]')].map(
      (root) => new PagePreloader(root),
    );
  }
}
