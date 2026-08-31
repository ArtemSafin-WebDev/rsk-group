/** Controls the active state and keyboard navigation of the materials tabs. */
export class MaterialsTabs {
  private readonly tabs: HTMLButtonElement[];
  private readonly panels: HTMLElement[];

  static initAll(scope: ParentNode = document): MaterialsTabs[] {
    return [...scope.querySelectorAll<HTMLElement>('[data-materials-tabs]')].map(
      (root) => new MaterialsTabs(root),
    );
  }

  constructor(root: HTMLElement) {
    this.tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-materials-tab]')];
    this.panels = [...root.querySelectorAll<HTMLElement>('[data-materials-panel]')];

    if (this.panels.length === 0 || this.tabs.length === 0) {
      throw new Error('MaterialsTabs requires tabs and panels.');
    }

    this.tabs.forEach((tab) => {
      tab.addEventListener('click', () => this.activate(tab));
      tab.addEventListener('keydown', (event) => this.handleKeydown(event, tab));
    });

    this.activate(
      this.tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ?? this.tabs[0],
    );
  }

  private handleKeydown(event: KeyboardEvent, currentTab: HTMLButtonElement): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const currentIndex = this.tabs.indexOf(currentTab);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % this.tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = this.tabs.length - 1;

    const nextTab = this.tabs[nextIndex];
    if (!nextTab) return;

    this.activate(nextTab);
    nextTab.focus();
  }

  private activate(activeTab: HTMLButtonElement): void {
    const activePanelId = activeTab.getAttribute('aria-controls');

    this.tabs.forEach((tab) => {
      const isActive = tab === activeTab;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    this.panels.forEach((panel) => {
      panel.hidden = panel.id !== activePanelId;
    });
  }
}
