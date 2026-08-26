import { readdirSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import handlebars from 'vite-plugin-handlebars';

const root = resolve(import.meta.dirname, 'src');
const iconsDirectory = resolve(root, 'icons');
const virtualSpriteId = 'virtual:svg-sprite';
const resolvedVirtualSpriteId = `\0${virtualSpriteId}`;
const pages = Object.fromEntries(
  readdirSync(root)
    .filter((file) => file.endsWith('.html'))
    .map((file) => [basename(file, '.html'), resolve(root, file)]),
);

function createSvgSpritePlugin(): Plugin {
  return {
    name: 'local-svg-sprite',
    resolveId(id) {
      return id === virtualSpriteId ? resolvedVirtualSpriteId : undefined;
    },
    load(id) {
      if (id !== resolvedVirtualSpriteId) return undefined;

      const symbols = readdirSync(iconsDirectory)
        .filter((file) => file.endsWith('.svg'))
        .sort()
        .map((file) => {
          const filePath = resolve(iconsDirectory, file);
          const svg = readFileSync(filePath, 'utf8');
          const viewBox = svg.match(/viewBox=["']([^"']+)["']/i)?.[1] ?? '0 0 24 24';
          const content = svg
            .replace(/^[\s\S]*?<svg\b[^>]*>/i, '')
            .replace(/<\/svg>[\s\S]*$/i, '')
            .trim();
          const name = basename(file, '.svg').replace(/[^a-zA-Z0-9_-]/g, '-');

          this.addWatchFile(filePath);

          return `<symbol id="icon-${name}" viewBox="${viewBox}">${content}</symbol>`;
        })
        .join('');

      const sprite = `<svg id="__svg__icons__dom__" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">${symbols}</svg>`;

      return `
        const sprite = ${JSON.stringify(sprite)};
        const previousSprite = document.getElementById('__svg__icons__dom__');
        previousSprite?.remove();
        document.body.insertAdjacentHTML('beforeend', sprite);
      `;
    },
  };
}

const pageData: Record<string, Record<string, unknown>> = {
  '/index.html': {
    title: 'Главная',
    description: 'Главная страница проекта',
    page: 'home',
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
    createSvgSpritePlugin(),
  ],
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: pages,
    },
  },
});
