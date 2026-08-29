# RSK Group

Многостраничная статическая сборка на Vite.

## Команды

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Структура

- `src/*.html` — страницы проекта;
- `src/partials` — переиспользуемые Handlebars-компоненты и общие шаблоны;
- `src/scripts` — TypeScript;
- `src/styles/components` — отдельный SCSS-файл для каждого компонента;
- `src/styles` — глобальные стили, токены и стили страниц;
- `src/fonts` — локальные файлы Vela Sans;
- `src/icons` — исходные SVG для спрайта;
- `public` — статические файлы без обработки;
- `dist` — production-сборка.

## Компоненты

Каждый переиспользуемый компонент состоит из отдельного Handlebars-partial в `src/partials` и отдельного SCSS-файла в `src/styles/components`. Классы компонентов именуются по БЭМ; состояния оформляются модификаторами (`block--state`), а не глобальными `is-*` или `has-*` классами.

Пункты основной навигации шапки задаются в массиве `headerNavigationItems` в `vite.config.ts`. Каждый пункт содержит `label` и `url`.

Кнопка по умолчанию использует серый фон и большой размер. Для белого, компактного и полноширинного вариантов передайте `variant="white"`, `size="small"` и `fullWidth=true`. Параметр `icon` принимает URL любой иконки и является необязательным:

```html
{{> button label="Смотреть все" icon="/icons/arrow-right.svg"}}
{{> button variant="white" size="small" label="Связаться"}}
{{> button variant="white" label="Связаться" fullWidth=true}}
```

Круглая кнопка со стрелкой использует иконку `arrow-right`, серый фон по умолчанию и вариант `white`. Она также принимает доступное имя, тип и состояние `disabled`:

```html
{{> arrow-button ariaLabel="Перейти далее"}}
{{> arrow-button variant="white" ariaLabel="Перейти далее"}}
{{> arrow-button type="submit" ariaLabel="Отправить" disabled=true}}
```

Парные стрелки слайдера соответствуют макету 64 × 64 px и содержат готовые data-атрибуты для Swiper Navigation:

```html
{{> slider-navigation
  ariaLabel="Навигация по проектам"
  prevAriaLabel="Предыдущий проект"
  nextAriaLabel="Следующий проект"
}}
```

Передавайте элементы кнопок в настройки конкретного экземпляра Swiper. Такой способ безопасен для страницы с несколькими слайдерами и не требует глобальных селекторов:

```ts
const section = document.querySelector<HTMLElement>('[data-projects-slider]');

if (section) {
  const swiperElement = section.querySelector<HTMLElement>('.swiper');
  const prevEl = section.querySelector<HTMLButtonElement>('[data-swiper-button-prev]');
  const nextEl = section.querySelector<HTMLButtonElement>('[data-swiper-button-next]');

  if (swiperElement && prevEl && nextEl) {
    new Swiper(swiperElement, {
      modules: [Navigation],
      navigation: { prevEl, nextEl },
    });
  }
}
```

Компонент поддерживает добавляемые Swiper классы `swiper-button-disabled` и `swiper-button-lock`, а также нативные состояния `disabled` и `aria-disabled`.

Карточка материала принимает заголовок, обложку, ссылку и метаданные файла:

```html
{{> material-card
  title="3Д модели светильников"
  imageSrc="/images/material-card/3d-models.webp"
  imageAlt="Обложка материала «3Д модели светильников»"
  downloadUrl="/files/3d-models.pdf"
  fileType="PDF"
  fileSize="2,2 Мб"
}}
```

Карточка направления сохраняет пропорцию 910 × 587 через grid stack. Основная ссылка кликабельна по всей площади, а `subcategories` передаётся массивом `{ label, url }` из контекста страницы:

```html
{{> direction-card
  title="Архитектурное"
  titleSecondLine="освещение"
  url="/directions/architectural-lighting.html"
  defaultImageSrc="/images/direction-card/outdoor-lighting.webp"
  hoverImageSrc="/images/direction-card/architectural-lighting.webp"
  subcategories=directionCardSubcategories
  subcategoriesAriaLabel="Подкатегории архитектурного освещения"
}}
```

Карточка решения сохраняет пропорцию 910,5 × 610 через `aspect-ratio`. При наведении или фокусе изображение затемняется и появляется круглая кнопка со стрелкой:

```html
{{> solution-card
  title="Улицы и дороги"
  url="/solutions/streets-and-roads.html"
  imageSrc="/images/solution-card/streets-and-roads.webp"
}}
```

Карточка категории собрана через grid stack. Модификатор `wide=true` растягивает её на две колонки родительского grid; на мобильном оба варианта получают одинаковую компоновку. `imageModifier` задаёт подготовленный crop конкретного изображения:

```html
{{> category-card
  title="Смарт-опоры"
  count="18"
  url="/catalog/smart-poles.html"
  imageSrc="/images/category-card/smart-poles.png"
  imageModifier="smart-poles"
  wide=true
}}
```

Карточка товара сохраняет адаптивные пропорции через grid stack. На hover и `focus-visible` фон меняет цвет, а в центре появляется круглая кнопка со стрелкой:

```html
{{> product-card
  title="Светодиодный светильник"
  titleTail="RSC COMFORT 24-1860"
  primaryTag="Хит"
  secondaryTag="Новинка"
  url="/catalog/rsc-comfort-24-1860.html"
  imageSrc="/images/product-card/rsc-comfort-24-1860.png"
}}
```

Карточка скачивания принимает название файла или действия, размер и URL:

```html
{{> download-card
  title="Скачать полный каталог в PDF"
  fileSize="2,2 Мб"
  downloadUrl="/files/catalog.pdf"
  ariaLabel="Скачать полный каталог в PDF, размер 2,2 Мб"
}}
```

Пагинация принимает массив `pages` из объектов `{ label, url, isCurrent }`. Текущая страница отмечается `isCurrent: true`; компонент сам добавляет активный БЭМ-модификатор и `aria-current="page"`:

```html
{{> pagination
  pages=paginationPages
  ariaLabel="Страницы каталога"
}}
```

Чтобы добавить страницу, создайте HTML-файл в `src` и добавьте ее данные в `pageData` внутри `vite.config.ts`. Все HTML-файлы верхнего уровня подключаются к production-сборке автоматически.

Иконка `src/icons/example.svg` доступна по пути `/icons/example.svg` и подключается внутри БЭМ-компонента так:

```html
<img class="component__icon" src="/icons/example.svg" width="24" height="24" alt="" aria-hidden="true" />
```

## Адаптив

В проекте используется только один мобильный breakpoint — `57.6rem` (`576px`). Мобильные стили подключаются общим миксином:

```scss
@use 'media';

.component {
  // Desktop styles

  @include media.mobile {
    // Styles for screens up to 57.6rem
  }
}
```

Не создавайте локальные медиавыражения с другими breakpoint-значениями.

## Единицы измерения

Корневой размер шрифта равен `62.5%`, то есть `1rem = 10px` при стандартных настройках браузера. Все фиксированные размеры в стилях задаются только в `rem`: `16px → 1.6rem`, `40px → 4rem`. Исключения — безразмерные значения, проценты и viewport-единицы там, где они описывают поведение макета.

Переиспользуемый `.container` имеет максимальную ширину `184rem`. Боковые внутренние отступы задаются переменной `--container-padding-inline`: `4rem` на десктопе и `1.6rem` на мобильном разрешении.
