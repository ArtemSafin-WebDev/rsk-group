export class FooterAccordions {
  private readonly groups: HTMLElement[];

  constructor(container: HTMLElement) {
    this.groups = [...container.querySelectorAll<HTMLElement>('[data-footer-accordion]')];
    this.bindEvents();
  }

  private bindEvents() {
    this.groups.forEach((group) => {
      group.querySelector<HTMLButtonElement>('.site-footer__mobile-nav-trigger')?.addEventListener('click', () => {
        const willOpen = !group.classList.contains('is-open');

        this.groups.forEach((item) => this.setState(item, false));
        this.setState(group, willOpen);
      });
    });
  }

  private setState(group: HTMLElement, isOpen: boolean) {
    group.classList.toggle('is-open', isOpen);
    group
      .querySelector<HTMLButtonElement>('.site-footer__mobile-nav-trigger')
      ?.setAttribute('aria-expanded', String(isOpen));
  }

  static initAll() {
    document
      .querySelectorAll<HTMLElement>('.site-footer__mobile-navigation')
      .forEach((container) => new FooterAccordions(container));
  }
}
