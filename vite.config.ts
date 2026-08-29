import { readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';

const root = resolve(import.meta.dirname, 'src');
const requestSubjects = [
  { label: 'Заказать оборудование', value: 'equipment' },
  { label: 'Пригласить в тендер', value: 'tender' },
  { label: 'Заказать проект', value: 'project' },
  { label: 'Другое', value: 'other' },
];
const headerNavigationItems = [{ label: 'Каталог', url: '#catalog' }];
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
  '/catalog.html': {
    title: 'Каталог — РСК Групп',
    description: 'Каталог решений РСК Групп для освещения, благоустройства и городской среды',
    page: 'catalog',
    catalogArchitecturalSection: {
      id: 'architectural-lighting',
      title: 'Архитектурное освещение',
      url: '#architectural-lighting',
      buttonLabel: 'Смотреть все',
      cards: [
        {
          title: 'Линейные',
          count: 18,
          url: '#linear',
          wide: true,
          imageSrc: '/images/category-card/catalog/linear.png',
          imageModifier: 'catalog-linear',
        },
        {
          title: 'Прожекторы',
          count: 18,
          url: '#floodlights',
          wide: true,
          imageSrc: '/images/category-card/catalog/floodlights.png',
          imageWidth: 278,
          imageHeight: 907,
          imageModifier: 'catalog-floodlights',
        },
        {
          title: 'Акцентные',
          count: 18,
          url: '#accent',
          wide: true,
          imageSrc: '/images/category-card/catalog/accent.png',
          imageModifier: 'catalog-accent',
        },
        {
          title: 'Гибкий неон',
          count: 67,
          url: '#flexible-neon',
          imageSrc: '/images/category-card/catalog/flexible-neon.png',
          imageModifier: 'catalog-flexible-neon',
        },
        {
          title: 'Грунтовые',
          count: 67,
          url: '#ground',
          imageSrc: '/images/category-card/catalog/ground.png',
          imageModifier: 'catalog-ground',
        },
      ],
    },
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
        return { requestSubjects, headerNavigationItems, ...(pageData[pagePath] ?? {}) };
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
