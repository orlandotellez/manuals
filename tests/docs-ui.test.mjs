/**
 * Regression tests for the documentation interface.
 *
 * They read the built output, so they run after `pnpm build` and check the two
 * things a visitor would notice first and that no type checker can catch: the
 * in-page index staying inside its column, and the search actually searching.
 * Each test names the spec it protects (`odd/tasks/astro-docs-site.md`).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

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

test('S4 code-block chrome stays out of the search index', () => {
  const html = read('dist/docs/09-direcciones-ip/index.html');

  assert.match(html, /class="code-block__bar"[^>]*data-pagefind-ignore/);
});

test('S4 the home page lists every section and every manual', () => {
  const html = read('dist/index.html');

  assert.equal((html.match(/class="section-card"/g) ?? []).length, 15);
  assert.equal((html.match(/class="section-card__link"/g) ?? []).length, 46);
});
