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

Карточка материала принимает заголовок, обложку, ссылку и метаданные файла:

```html
{{> material-card
  title="3Д модели светильников"
  imageSrc="/images/material-card/3d-models.png"
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
  defaultImageSrc="/images/direction-card/outdoor-lighting.png"
  hoverImageSrc="/images/direction-card/architectural-lighting.png"
  subcategories=directionCardSubcategories
  subcategoriesAriaLabel="Подкатегории архитектурного освещения"
}}
```

Карточка решения сохраняет пропорцию 910,5 × 610 через `aspect-ratio`. При наведении или фокусе изображение затемняется и появляется круглая кнопка со стрелкой:

```html
{{> solution-card
  title="Улицы и дороги"
  url="/solutions/streets-and-roads.html"
  imageSrc="/images/solution-card/streets-and-roads.jpg"
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
