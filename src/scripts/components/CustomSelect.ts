type CustomSelectElements = {
  native: HTMLSelectElement;
  trigger: HTMLButtonElement;
  value: HTMLElement;
  listbox: HTMLElement;
  options: HTMLElement[];
};

/**
 * Accessible custom select with native form submission and keyboard navigation.
 */
export class CustomSelect {
  private readonly root: HTMLElement;
  private readonly elements: CustomSelectElements;
  private readonly placeholder: string;
  private activeIndex = -1;
  private isOpen = false;
  private animationFrame?: number;
  private hideTimer?: number;

  static initAll(scope: ParentNode = document): CustomSelect[] {
    return [...scope.querySelectorAll<HTMLElement>('[data-custom-select]')].map(
      (root) => new CustomSelect(root),
    );
  }

  constructor(root: HTMLElement) {
    this.root = root;

    const native = root.querySelector<HTMLSelectElement>('[data-custom-select-native]');
    const trigger = root.querySelector<HTMLButtonElement>('[data-custom-select-trigger]');
    const value = root.querySelector<HTMLElement>('[data-custom-select-value]');
    const listbox = root.querySelector<HTMLElement>('[data-custom-select-listbox]');
    const options = [...root.querySelectorAll<HTMLElement>('[data-custom-select-option]')];

    if (!native || !trigger || !value || !listbox || options.length === 0) {
      throw new Error('CustomSelect requires native, trigger, value, listbox and option elements.');
    }

    this.elements = { native, trigger, value, listbox, options };
    this.placeholder = native.options[0]?.text ?? '';

    this.bindEvents();
    this.syncSelection();

    if (root.dataset.initialOpen === 'true') {
      this.open(false, false);
    } else {
      this.close(false);
    }
  }

  private bindEvents(): void {
    const { native, trigger, options } = this.elements;

    trigger.addEventListener('click', () => this.toggle());
    trigger.addEventListener('keydown', this.handleTriggerKeydown);
    native.addEventListener('change', () => this.syncSelection());

    options.forEach((option, index) => {
      option.addEventListener('click', () => this.select(index));
      option.addEventListener('pointermove', () => this.setActive(index, false));
    });

    document.addEventListener('pointerdown', this.handleDocumentPointerDown);
    document.addEventListener('custom-select:open', this.handleAnotherSelectOpen);
  }

  private handleDocumentPointerDown = (event: PointerEvent): void => {
    if (!this.root.contains(event.target as Node)) this.close(false);
  };

  private handleAnotherSelectOpen = (event: Event): void => {
    if ((event as CustomEvent<HTMLElement>).detail !== this.root) this.close(false);
  };

  private handleTriggerKeydown = (event: KeyboardEvent): void => {
    const lastIndex = this.elements.options.length - 1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen) this.open();
        this.setActive(Math.min(this.activeIndex + 1, lastIndex));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this.isOpen) this.open();
        this.setActive(Math.max(this.activeIndex - 1, 0));
        break;
      case 'Home':
        if (!this.isOpen) return;
        event.preventDefault();
        this.setActive(0);
        break;
      case 'End':
        if (!this.isOpen) return;
        event.preventDefault();
        this.setActive(lastIndex);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.isOpen && this.activeIndex >= 0) {
          this.select(this.activeIndex);
        } else {
          this.open();
        }
        break;
      case 'Escape':
        if (!this.isOpen) return;
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close(false);
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          this.selectByPrefix(event.key);
        }
    }
  };

  private toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private open(announce = true, animate = true): void {
    if (this.isOpen) return;

    document.dispatchEvent(new CustomEvent('custom-select:open', { detail: this.root }));
    this.isOpen = true;
    window.clearTimeout(this.hideTimer);
    this.elements.listbox.hidden = false;
    this.elements.trigger.setAttribute('aria-expanded', 'true');

    if (animate) {
      this.animationFrame = window.requestAnimationFrame(() => {
        if (this.isOpen) this.root.classList.add('is-open');
      });
    } else {
      this.root.classList.add('is-open');
    }

    const selectedIndex = this.elements.options.findIndex(
      (option) => option.dataset.value === this.elements.native.value,
    );

    if (selectedIndex >= 0) {
      this.setActive(selectedIndex, announce);
    } else {
      this.activeIndex = -1;
      this.elements.options.forEach((option) => option.classList.remove('is-active'));
      this.elements.trigger.removeAttribute('aria-activedescendant');
    }
  }

  private close(restoreActive = true): void {
    if (!this.isOpen && this.elements.listbox.hidden) return;

    this.isOpen = false;
    window.cancelAnimationFrame(this.animationFrame ?? 0);
    this.root.classList.remove('is-open');
    this.elements.trigger.setAttribute('aria-expanded', 'false');
    this.elements.trigger.removeAttribute('aria-activedescendant');

    window.clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => {
      if (!this.isOpen) this.elements.listbox.hidden = true;
    }, 180);

    if (restoreActive) {
      const selectedIndex = this.elements.options.findIndex(
        (option) => option.dataset.value === this.elements.native.value,
      );
      this.activeIndex = selectedIndex;
    }
  }

  private setActive(index: number, scrollIntoView = true): void {
    const option = this.elements.options[index];
    if (!option) return;

    this.activeIndex = index;
    this.elements.options.forEach((item, itemIndex) => {
      item.classList.toggle('is-active', itemIndex === index);
    });
    this.elements.trigger.setAttribute('aria-activedescendant', option.id);

    if (scrollIntoView) option.scrollIntoView({ block: 'nearest' });
  }

  private select(index: number): void {
    const option = this.elements.options[index];
    if (!option) return;

    this.elements.native.value = option.dataset.value ?? '';
    this.elements.native.dispatchEvent(new Event('change', { bubbles: true }));
    this.close();
    this.elements.trigger.focus();
  }

  private selectByPrefix(character: string): void {
    const query = character.toLocaleLowerCase('ru-RU');
    const matchIndex = this.elements.options.findIndex((option) =>
      option.textContent?.trim().toLocaleLowerCase('ru-RU').startsWith(query),
    );

    if (matchIndex < 0) return;
    if (!this.isOpen) this.open(false);
    this.setActive(matchIndex);
  }

  private syncSelection(): void {
    const { native, options, value } = this.elements;
    const selectedOption = options.find((option) => option.dataset.value === native.value);

    value.textContent = selectedOption?.textContent?.trim() || this.placeholder;
    this.root.classList.toggle('has-value', Boolean(selectedOption));
    options.forEach((option) => {
      option.setAttribute('aria-selected', String(option === selectedOption));
    });
  }
}
