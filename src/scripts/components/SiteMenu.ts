export class SiteMenu {
  private readonly menu: HTMLElement;
  private readonly header: HTMLElement;
  private readonly toggles: HTMLButtonElement[];
  private readonly closeControls: HTMLElement[];
  private readonly accordions: HTMLElement[];
  private readonly mobileMedia = window.matchMedia('(max-width: 576px)');
  private scrollPosition = 0;
  private lastFocusedElement: HTMLElement | null = null;

  constructor(menu: HTMLElement, header: HTMLElement) {
    this.menu = menu;
    this.header = header;
    this.toggles = [...document.querySelectorAll<HTMLButtonElement>('[data-menu-toggle]')];
    this.closeControls = [...menu.querySelectorAll<HTMLElement>('[data-menu-close]')];
    this.accordions = [...menu.querySelectorAll<HTMLElement>('[data-menu-accordion]')];

    this.bindEvents();
    this.syncAccordions();
  }

  private get isOpen() {
    return this.menu.classList.contains('is-open');
  }

  private bindEvents() {
    this.toggles.forEach((toggle) => {
      toggle.addEventListener('click', () => (this.isOpen ? this.close() : this.open(toggle)));
    });

    this.closeControls.forEach((control) => control.addEventListener('click', () => this.close()));

    this.menu.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
      link.addEventListener('click', () => this.close(false));
    });

    this.accordions.forEach((accordion) => {
      accordion.querySelector<HTMLButtonElement>('.site-menu__group-trigger')?.addEventListener('click', () => {
        if (!this.mobileMedia.matches) return;

        const willOpen = !accordion.classList.contains('is-open');

        this.accordions.forEach((item) => this.setAccordionState(item, false));
        this.setAccordionState(accordion, willOpen);
      });
    });

    this.mobileMedia.addEventListener('change', () => this.syncAccordions());
    document.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  private open(trigger: HTMLElement) {
    this.scrollPosition = window.scrollY;
    this.lastFocusedElement = trigger;
    this.syncAccordions();

    this.header.classList.remove('is-hidden');
    this.header.inert = false;
    document.body.style.top = `-${this.scrollPosition}px`;
    document.documentElement.classList.add('is-menu-open');
    this.menu.classList.add('is-open');
    this.header.classList.add('is-menu-open');
    this.menu.setAttribute('aria-hidden', 'false');
    this.toggles.forEach((toggle) => {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Закрыть меню');
    });

    window.requestAnimationFrame(() => this.toggles[0]?.focus());
  }

  private close(restoreFocus = true) {
    if (!this.isOpen) return;

    this.menu.classList.remove('is-open');
    this.header.classList.remove('is-menu-open');
    this.menu.setAttribute('aria-hidden', 'true');
    this.toggles.forEach((toggle) => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Открыть меню');
    });

    document.documentElement.classList.remove('is-menu-open');
    document.body.style.top = '';
    window.scrollTo({ top: this.scrollPosition, behavior: 'instant' });
    window.dispatchEvent(new Event('site-menu:closed'));

    if (restoreFocus) this.lastFocusedElement?.focus();
  }

  private handleKeydown(event: KeyboardEvent) {
    if (!this.isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = [
      ...this.header.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
      ...this.menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
    ].filter((element) => element.offsetParent !== null && element.tabIndex !== -1);

    const first = focusable[0];
    const last = focusable.at(-1);

    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private syncAccordions() {
    this.accordions.forEach((accordion) => {
      const trigger = accordion.querySelector<HTMLButtonElement>('.site-menu__group-trigger');

      if (!trigger) return;

      if (this.mobileMedia.matches) {
        trigger.removeAttribute('aria-disabled');
        trigger.removeAttribute('tabindex');
        this.setAccordionState(accordion, accordion.hasAttribute('data-initial-open'));
      } else {
        accordion.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        trigger.setAttribute('aria-disabled', 'true');
        trigger.setAttribute('tabindex', '-1');
      }
    });
  }

  private setAccordionState(accordion: HTMLElement, isOpen: boolean) {
    accordion.classList.toggle('is-open', isOpen);
    accordion
      .querySelector<HTMLButtonElement>('.site-menu__group-trigger')
      ?.setAttribute('aria-expanded', String(isOpen));
  }

  static initAll() {
    const header = document.querySelector<HTMLElement>('.site-header');

    if (!header) return;

    document.querySelectorAll<HTMLElement>('[data-site-menu]').forEach((menu) => new SiteMenu(menu, header));
  }
}
