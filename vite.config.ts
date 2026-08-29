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
    catalogOutdoorSection: {
      id: 'outdoor-lighting',
      title: 'Наружное освещение',
      url: '#outdoor-lighting',
      buttonLabel: 'Смотреть все',
      cards: [
        {
          title: 'Осветительные комплексы',
          count: 38,
          url: '#lighting-complexes',
          wide: true,
          imageSrc: '/images/category-card/catalog/linear.png',
          imageWidth: 1190,
          imageHeight: 840,
        },
        {
          title: 'Смарт-опоры',
          count: 18,
          url: '#smart-poles',
          wide: true,
          imageSrc: '/images/category-card/catalog/outdoor/smart-poles.png',
          imageWidth: 1190,
          imageHeight: 840,
        },
        {
          title: 'Торшерные',
          count: 67,
          url: '#park-lighting',
          imageSrc: '/images/category-card/catalog/outdoor/park.png',
          imageWidth: 664,
          imageHeight: 720,
        },
        {
          title: 'Ландшафтные',
          count: 67,
          url: '#landscape-lighting',
          imageSrc: '/images/category-card/catalog/outdoor/landscape.png',
          imageWidth: 664,
          imageHeight: 720,
        },
        {
          title: 'Подвесные',
          count: 67,
          url: '#pendant-lighting',
          imageSrc: '/images/category-card/catalog/flexible-neon.png',
        },
        {
          title: 'Прожекторы',
          count: 67,
          url: '#outdoor-floodlights',
          imageSrc: '/images/category-card/catalog/outdoor/floodlights.png',
          imageWidth: 664,
          imageHeight: 720,
        },
        {
          title: 'Опоры контрастного освещения',
          count: 67,
          url: '#contrast-lighting-poles',
          imageSrc: '/images/category-card/catalog/outdoor/contrast-lighting-poles.png',
          imageWidth: 664,
          imageHeight: 720,
        },
        {
          title: 'Консольные',
          count: 67,
          url: '#cantilever-lighting',
          imageSrc: '/images/category-card/catalog/flexible-neon.png',
        },
        {
          title: 'Грунтовые',
          count: 67,
          url: '#outdoor-ground',
          imageSrc: '/images/category-card/catalog/ground.png',
          imageWidth: 664,
          imageHeight: 720,
        },
        {
          title: 'Встраиваемые',
          count: 67,
          url: '#recessed-lighting',
          imageSrc: '/images/category-card/catalog/outdoor/recessed.png',
          imageWidth: 664,
          imageHeight: 720,
        },
      ],
    },
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
          imageWidth: 1190,
          imageHeight: 840,
        },
        {
          title: 'Прожекторы',
          count: 18,
          url: '#floodlights',
          wide: true,
          imageSrc: '/images/category-card/catalog/architectural/floodlights.png',
          imageWidth: 1190,
          imageHeight: 840,
        },
        {
          title: 'Акцентные',
          count: 18,
          url: '#accent',
          wide: true,
          imageSrc: '/images/category-card/catalog/architectural/accent.png',
          imageWidth: 1190,
          imageHeight: 840,
        },
        {
          title: 'Гибкий неон',
          count: 67,
          url: '#flexible-neon',
          imageSrc: '/images/category-card/catalog/flexible-neon.png',
        },
        {
          title: 'Грунтовые',
          count: 67,
          url: '#ground',
          imageSrc: '/images/category-card/catalog/ground.png',
          imageWidth: 664,
          imageHeight: 720,
        },
      ],
    },
    catalogMetalSection: {
      id: 'metal-constructions',
      title: 'Металлоконструкции',
      url: '#metal-constructions',
      buttonLabel: 'Смотреть все',
      cards: [
        {
          title: 'Опоры',
          count: 18,
          url: '#poles',
          wide: true,
          imageSrc: '/images/category-card/catalog/linear.png',
          imageWidth: 1190,
          imageHeight: 840,
        },
        {
          title: 'Опоры контрастного освещения',
          count: 67,
          url: '#metal-contrast-lighting-poles',
          imageSrc: '/images/category-card/catalog/metal/contrast-lighting-poles.png',
          imageWidth: 664,
          imageHeight: 720,
        },
        {
          title: 'Кронштейны',
          count: 67,
          url: '#brackets',
          imageSrc: '/images/category-card/catalog/metal/brackets.png',
          imageWidth: 664,
          imageHeight: 720,
        },
        {
          title: 'Кронштейны',
          count: 67,
          url: '#round-brackets',
          imageSrc: '/images/category-card/catalog/metal/brackets-round.png',
          imageWidth: 664,
          imageHeight: 720,
        },
        {
          title: 'Закладные детали',
          count: 67,
          url: '#foundation-parts',
          imageSrc: '/images/category-card/catalog/accent.png',
        },
        {
          title: 'Посты питания',
          count: 67,
          url: '#power-posts',
          imageSrc: '/images/category-card/catalog/flexible-neon.png',
        },
        {
          title: 'Смарт-опоры',
          count: 67,
          url: '#metal-smart-poles',
          imageSrc: '/images/category-card/smart-poles.png',
          imageWidth: 664,
          imageHeight: 720,
        },
      ],
    },
    catalogInstallationsSection: {
      id: 'light-installations',
      title: 'Световые инсталляции',
      url: '#light-installations',
      buttonLabel: 'Смотреть все',
      cards: [
        {
          title: 'Одуванчики',
          count: 18,
          url: '#dandelions',
          wide: true,
          imageSrc: '/images/category-card/catalog/linear.png',
          imageWidth: 1190,
          imageHeight: 840,
        },
        {
          title: 'Арт-объекты',
          count: 18,
          url: '#art-objects',
          wide: true,
          imageSrc: '/images/category-card/catalog/installations/art-objects.png',
          imageWidth: 1190,
          imageHeight: 840,
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
