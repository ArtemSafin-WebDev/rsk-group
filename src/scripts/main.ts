import 'virtual:svg-sprite';
import '../styles/main.scss';

const page = document.body.dataset.page;

if (page) {
  document.documentElement.dataset.page = page;
}

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

  const feedback = document.querySelector<HTMLElement>('[data-copy-feedback]');

  document.querySelectorAll<HTMLButtonElement>('[data-copy-token]').forEach((button) => {
    button.addEventListener('click', async () => {
      const token = button.dataset.copyToken;
      if (!token) return;

      try {
        await navigator.clipboard.writeText(token);
        if (feedback) feedback.textContent = `Скопировано: ${token}`;
      } catch {
        if (feedback) feedback.textContent = `Значение: ${token}`;
      }
    });
  });
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
