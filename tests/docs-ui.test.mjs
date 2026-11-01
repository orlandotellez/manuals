/**
 * Regression tests for the documentation interface.
 *
 * They read the built output, so they run after `pnpm build` and check what a
 * visitor notices first and no type checker can catch: the manual's chapters
 * living on their own pages, one h1 per page, the pager walking those chapters,
 * and the search searching. Each test names the spec it protects
 * (`odd/tasks/astro-docs-site.md`).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const MANUAL = '09-direcciones-ip';
const FIRST = '1-el-problema-que-resuelven-las-direcciones-ip';
const chapterPage = (slug) => `dist/docs/${MANUAL}/${slug}/index.html`;

test('S4 search: the pagefind module is never replaced by options()', () => {
  // Pagefind 1.5 resolves `options()` with undefined; assigning that to the
  // engine is what made the dialog claim the site was not built yet.
  const source = read('src/components/SiteSearch.astro');

  assert.doesNotMatch(source, /pagefind\s*=\s*await\s+installed\.options\(/);
  assert.match(source, /await\s+installed\.options\(/);
  assert.match(source, /configured \?\? installed/);
});

test('S2 the in-page index cannot outgrow its column', () => {
  const css = read('src/styles/docs.css');
  const start = css.indexOf('.toc__list {');

  assert.ok(start > 0, 'falta la regla .toc__list');
  assert.match(css.slice(start, start + 400), /grid-template-columns:\s*minmax\(0/);
});

test('S2 the index column exists on a 1280 laptop', () => {
  const css = read('src/styles/docs.css');

  assert.match(css, /@media \(min-width: 72rem\)/);
  assert.doesNotMatch(css, /@media \(min-width: 82rem\)/);
});

test('S2 prose wraps long tokens instead of widening the page', () => {
  const css = read('src/styles/docs.css');
  const start = css.indexOf('.prose {');

  assert.ok(start > 0, 'falta la regla .prose');
  assert.match(css.slice(start, start + 300), /overflow-wrap:\s*(anywhere|break-word)/);
});

test('S10 every corner is square by design', () => {
  const tokens = read('src/styles/tokens.css');
  const radii = [...tokens.matchAll(/--radius-[a-z]+:\s*([^;]+);/g)].map((match) => match[1].trim());

  assert.ok(radii.length >= 6, `tokens de radio: ${radii.length}`);
  assert.deepEqual([...new Set(radii)], ['0'], 'algún token de radio no es 0');

  for (const file of ['base', 'layout', 'docs', 'landing', 'search']) {
    const css = read(`src/styles/${file}.css`);

    for (const match of css.matchAll(/border-radius:\s*([^;]+);/g)) {
      assert.match(
        match[1].trim(),
        /^(0|var\(--radius-[a-z]+\))$/,
        `${file}.css redondea con "${match[1].trim()}"`,
      );
    }
  }
});

test('S13 a manual is served as one page per chapter', () => {
  const entries = readdirSync(new URL(`../dist/docs/${MANUAL}/`, import.meta.url), {
    withFileTypes: true,
  });
  const chapters = entries.filter((entry) => entry.isDirectory());

  assert.ok(chapters.length >= 10, `capítulos de ${MANUAL}: ${chapters.length}`);

  // The cover lists every chapter and is a page of its own.
  const cover = read(`dist/docs/${MANUAL}/index.html`);
  assert.equal((cover.match(/class="chapters__link"/g) ?? []).length, chapters.length);

  // No page carries a whole manual any more: the biggest one is a chapter, not a
  // book, and it stays well under the size of the old single-file pages.
  const biggest = Math.max(
    ...chapters.map((entry) => statSync(new URL(`../dist/docs/${MANUAL}/${entry.name}/index.html`, import.meta.url)).size),
  );
  assert.ok(biggest < 2_000_000, `la página más pesada del manual pesa ${biggest} bytes`);
});

test('S13 no published page is empty', () => {
  // The failure this pins: every chapter page rendered an empty body, and the
  // build stayed green because nothing counted what reached the reader.
  const root = new URL('../dist/docs/', import.meta.url).pathname;
  const pages = [];

  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name === 'index.html') pages.push(path);
    }
  };

  walk(root);

  const empty = pages.filter((page) => {
    const html = readFileSync(page, 'utf8');
    const start = html.indexOf('<div class="prose">');
    if (start < 0) return false; // the catalog has no prose column

    const end = html.indexOf('</article>', start);
    const words = html
      .slice(start, end)
      .replace(/<[^>]+>/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    return words.length < 5;
  });

  assert.deepEqual(empty.map((page) => page.replace(root, '')), [], 'hay páginas sin contenido');
});

test('S11 the chapter being read is marked in the column', () => {
  const css = read('src/styles/docs.css');
  const start = css.indexOf(".docs-nav__chapter[aria-current='page']");

  assert.ok(start > 0, 'falta la regla que marca el capítulo actual');

  const rule = css.slice(start, css.indexOf('}', start));
  assert.match(rule, /background-color:/, 'el capítulo actual no se distingue por fondo');
  assert.match(rule, /color: var\(--brand\)/);

  // The markup and the stylesheet have to agree on the value.
  const html = read(chapterPage('5-las-clases-de-direcciones-el-legado'));
  assert.match(html, /class="docs-nav__chapter"[^>]*aria-current="page"/);
});

test('S11 the left column belongs to the manual being read', () => {
  const html = read(chapterPage(FIRST));

  // The manual's chapters are links to their own pages.
  const chapters = [...html.matchAll(/class="docs-nav__chapter" href="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(chapters.length >= 10, `capítulos en el árbol: ${chapters.length}`);
  assert.ok(
    chapters.every((href) => href.startsWith(`/docs/${MANUAL}/`)),
    'el árbol enlaza fuera del manual abierto',
  );

  // No other manual is offered: the only way out is the catalog link.
  assert.doesNotMatch(html, /class="docs-nav__link"/);
  assert.match(html, /class="docs-nav__back" href="\/docs\/"/);

  // The manual's own "Índice" section is not published as one more chapter.
  assert.doesNotMatch(html, /class="docs-nav__chapter"[^>]*>\s*Índice\s*</);
  assert.equal(html.includes(`/docs/${MANUAL}/indice/`), false);
});

test('S12 the pager walks chapters of this manual, one page at a time', () => {
  const first = read(chapterPage(FIRST));
  const middle = read(chapterPage('5-las-clases-de-direcciones-el-legado'));

  // First chapter: nothing before it.
  assert.doesNotMatch(first, /rel="prev"/);
  assert.match(first, new RegExp(`href="/docs/${MANUAL}/2-[^"]+" rel="next"`));

  // Any other chapter: both directions, inside the same manual.
  const links = [...middle.matchAll(/class="pager__link[^"]*" href="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(links.length, 2, `enlaces del paginador: ${links.join(', ')}`);
  assert.ok(links.every((href) => href.startsWith(`/docs/${MANUAL}/`)), 'el paginador cruza de manual');
});

test('S4 code-block chrome stays out of the search index', () => {
  const html = read('dist/docs/27-axum-init/1-crear-el-proyecto/index.html');
  const bar = /class="code-block__bar"[^>]*>/.exec(html);

  assert.ok(bar, 'la página no tiene bloques de código');
  assert.ok(bar[0].includes('data-pagefind-ignore'), `la barra del bloque es indexable: ${bar[0]}`);
});

test('S14 the home page lists technologies, not manuals', () => {
  const home = read('dist/index.html');

  assert.equal((home.match(/class="tech-card"/g) ?? []).length, 15, 'faltan tecnologías');
  assert.equal((home.match(/class="tech-logo"/g) ?? []).length, 15, 'faltan logos');
  assert.doesNotMatch(home, /class="catalog__link"/, 'la home no lista manuales');

  // Every mark named in the registry is a file the build ships.
  const sections = read('src/lib/library.mjs');
  const logos = [...sections.matchAll(/logo: '([^']+)'/g)].map((match) => match[1]);

  assert.equal(logos.length, 15);
  for (const logo of new Set(logos)) {
    const file = statSync(new URL(`../public/logos/${logo}.svg`, import.meta.url));
    assert.ok(file.size > 100, `public/logos/${logo}.svg está vacío`);
  }
});

test('S14 the catalog shows the technology of every manual', () => {
  const catalog = read('dist/docs/index.html');

  assert.equal((catalog.match(/catalog__logo/g) ?? []).length, 15);
  assert.equal((catalog.match(/catalog__item-logo/g) ?? []).length, 47);
  assert.equal((catalog.match(/class="catalog__link"/g) ?? []).length, 47);
});

test('S15 the dark surface is the chosen navy', () => {
  const tokens = read('src/styles/tokens.css');

  assert.match(tokens, /--surface: light-dark\(#[0-9a-f]{6}, #07090f\)/);
});
