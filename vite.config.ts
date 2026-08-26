import { readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';

const root = resolve(import.meta.dirname, 'src');
const pages = Object.fromEntries(
  readdirSync(root)
    .filter((file) => file.endsWith('.html'))
    .map((file) => [basename(file, '.html'), resolve(root, file)]),
);

const pageData: Record<string, Record<string, unknown>> = {
  '/index.html': {
    title: 'Главная',
    description: 'Главная страница проекта',
    page: 'home',
    catalogSubcategories: [
      { label: 'Линейные', url: '#linear' },
      { label: 'Прожекторы', url: '#floodlights' },
      { label: 'Акцентные', url: '#accent' },
      { label: 'Гибкий неон', url: '#flexible-neon' },
      { label: 'Грунтовые', url: '#ground' },
    ],
  },
  '/about.html': {
    title: 'О компании',
    description: 'Информация о компании',
    page: 'about',
  },
  '/ui-kit.html': {
    title: 'UI-kit — RSK Group',
    description: 'Визуальные токены и переиспользуемые компоненты RSK Group',
    page: 'ui-kit',
    directionCardSubcategories: [
      { label: 'Линейные', url: '#linear' },
      { label: 'Прожекторы', url: '#floodlights' },
      { label: 'Акцентные', url: '#accent' },
      { label: 'Гибкий неон', url: '#flexible-neon' },
      { label: 'Грунтовые', url: '#ground' },
    ],
  },
};

export default defineConfig({
  root,
  publicDir: resolve(import.meta.dirname, 'public'),
  plugins: [
    handlebars({
      partialDirectory: resolve(root, 'partials'),
      context(pagePath) {
        return pageData[pagePath] ?? {};
      },
    }),
  ],
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: pages,
    },
  },
});
