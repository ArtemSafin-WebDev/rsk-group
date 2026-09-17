import IMask from 'imask';

type FieldName = 'name' | 'phone' | 'email' | 'privacy';

type ValidatedField = {
  container: HTMLElement;
  control: HTMLInputElement;
  error: HTMLElement;
};

const PHONE_MASK = '+{7} (000) 000-00-00';

/**
 * Adds accessible inline validation and a Russian phone mask to the project form.
 */
export class ProjectRequestForm {
  private readonly form: HTMLFormElement;
  private readonly fields: Record<FieldName, ValidatedField>;
  private readonly phoneMask;

  static initAll(scope: ParentNode = document): ProjectRequestForm[] {
    return [...scope.querySelectorAll<HTMLFormElement>('[data-project-request-form]')].map(
      (form) => new ProjectRequestForm(form),
    );
  }

  constructor(form: HTMLFormElement) {
    this.form = form;
    this.fields = {
      name: this.getField('name'),
      phone: this.getField('phone'),
      email: this.getField('email'),
      privacy: this.getField('privacy'),
    };

    this.phoneMask = IMask(this.fields.phone.control, {
      mask: PHONE_MASK,
      lazy: true,
      overwrite: 'shift',
      prepare: (value, masked) => {
        if (masked.value === '' && value.startsWith('8')) return value.slice(1);

        return value;
      },
    });

    this.bindEvents();
  }

  private getField(name: FieldName): ValidatedField {
    const container = this.form.querySelector<HTMLElement>(
      `[data-project-request-field="${name}"]`,
    );
    const control = container?.querySelector<HTMLInputElement>(`[name="${name}"]`);
    const error = container?.querySelector<HTMLElement>('[data-project-request-error]');

    if (!container || !control || !error) {
      throw new Error(`Project request field "${name}" is incomplete.`);
    }

    control.setAttribute('aria-describedby', error.id);

    return { container, control, error };
  }

  private bindEvents(): void {
    const { name, phone, email, privacy } = this.fields;

    [name, email].forEach((field) => {
      field.control.addEventListener('blur', () => this.validateField(field));
      field.control.addEventListener('input', () => this.revalidateInvalidField(field));
    });

    phone.control.addEventListener('blur', () => this.validateField(phone));
    this.phoneMask.on('accept', () => this.revalidateInvalidField(phone));

    privacy.control.addEventListener('change', () => this.validateField(privacy));
    this.form.addEventListener('submit', this.handleSubmit);
    this.form.addEventListener('reset', this.handleReset);
  }

  private handleSubmit = (event: SubmitEvent): void => {
    const isValid = (Object.keys(this.fields) as FieldName[])
      .map((name) => this.validateField(this.fields[name]))
      .every(Boolean);

    if (isValid) return;

    event.preventDefault();
    const firstInvalidField = (Object.keys(this.fields) as FieldName[])
      .map((name) => this.fields[name])
      .find(({ container }) => container.classList.contains('is-invalid'));

    firstInvalidField?.control.focus();
  };

  private handleReset = (): void => {
    window.requestAnimationFrame(() => {
      this.phoneMask.value = this.fields.phone.control.value;
      Object.values(this.fields).forEach((field) => this.renderError(field, ''));
    });
  };

  private revalidateInvalidField(field: ValidatedField): void {
    if (field.container.classList.contains('is-invalid')) this.validateField(field);
  }

  private validateField(field: ValidatedField): boolean {
    const fieldName = field.control.name as FieldName;
    const value = field.control.value.trim();
    let message = '';

    field.control.setCustomValidity('');

    switch (fieldName) {
      case 'name':
        if (!value) {
          message = 'Введите имя';
        } else if (value.length < 2) {
          message = 'Имя должно содержать не менее двух символов';
        }
        break;
      case 'phone':
        if (!value) {
          message = 'Введите телефон';
        } else if (!this.phoneMask.masked.isComplete) {
          message = 'Введите телефон полностью';
        }
        break;
      case 'email':
        if (value && field.control.validity.typeMismatch) {
          message = 'Введите корректный email';
        }
        break;
      case 'privacy':
        if (!field.control.checked) {
          message = 'Подтвердите согласие на обработку персональных данных';
        }
        break;
    }

    field.control.setCustomValidity(message);
    this.renderError(field, message);

    return message === '';
  }

  private renderError(field: ValidatedField, message: string): void {
    const hasError = Boolean(message);

    field.container.classList.toggle('is-invalid', hasError);
    field.control.setAttribute('aria-invalid', String(hasError));
    field.error.textContent = message;
    field.error.hidden = !hasError;
  }
}
