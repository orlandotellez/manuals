#!/usr/bin/env node
/**
 * Internal link audit for the built site.
 *
 * Astro guarantees that a page it generated exists; it does not guarantee that
 * an `href` inside a manual points at one. The manuals were written for mdBook
 * and carry their own anchor indexes, so a slug that differs by one accent is a
 * silent 404. This script walks `dist/` and fails when a link or an anchor has
 * no destination, which is the check that keeps the migration honest.
 *
 * Usage: pnpm build && node scripts/check-links.mjs
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

/** Every .html file under a directory, recursively. */
async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await htmlFiles(path)));
    } else if (extname(entry.name) === '.html') {
      files.push(path);
    }
  }

  return files;
}

/** `id` attributes of a document, decoded the way a browser matches a fragment. */
function anchorsOf(html) {
  const ids = new Set();

  for (const match of html.matchAll(/\sid=["']([^"']+)["']/g)) {
    ids.add(match[1]);
  }

  return ids;
}

const forbidden = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

async function main() {
  try {
    await stat(dist);
  } catch {
    console.error('No hay dist/. Ejecuta `pnpm build` antes de auditar los enlaces.');
    process.exit(1);
  }

  const pages = await htmlFiles(dist);
  const cache = new Map();
  const problems = [];
  let checked = 0;

  const load = async (path) => {
    if (!cache.has(path)) cache.set(path, await readFile(path, 'utf8'));
    return cache.get(path);
  };

  /** Resolve a relative href against the page that contains it, inside dist. */
  const targetFile = (fromPage, pathname) => {
    const decoded = decodeURIComponent(pathname);
    const absolute = decoded.startsWith('/')
      ? join(dist, decoded)
      : resolve(dirname(fromPage), decoded);

    if (!absolute.startsWith(dist + sep) && absolute !== dist) return null;

    return decoded.endsWith('/') ? join(absolute, 'index.html') : absolute;
  };

  for (const page of pages) {
    const html = await load(page);
    const local = anchorsOf(html);

    for (const match of html.matchAll(/\s(?:href|src)=["']([^"'#][^"']*)["']/g)) {
      const raw = match[1].trim();
      if (forbidden.test(raw)) continue;

      const [pathname, fragment] = raw.split('#');
      const path = pathname.split('?')[0];

      if (path === '') {
        checked += 1;
        if (fragment && !local.has(decodeURIComponent(fragment))) {
          problems.push(`${page}: ancla inexistente "#${fragment}"`);
        }
        continue;
      }

      const file = targetFile(page, path);

      if (!file) {
        problems.push(`${page}: enlace fuera de dist "${raw}"`);
        continue;
      }

      checked += 1;

      let exists = false;
      try {
        const info = await stat(file);
        exists = info.isFile();
      } catch {
        exists = false;
      }

      if (!exists) {
        problems.push(`${page}: destino inexistente "${raw}"`);
        continue;
      }

      if (fragment && extname(file) === '.html') {
        const ids = anchorsOf(await load(file));

        if (!ids.has(decodeURIComponent(fragment))) {
          problems.push(`${page}: ancla inexistente "${raw}"`);
        }
      }
    }
  }

  if (problems.length > 0) {
    console.error(`Enlaces internos rotos: ${problems.length} de ${checked}`);
    for (const problem of problems.slice(0, 40)) {
      console.error(`  - ${problem.replace(`${dist}/`, '')}`);
    }
    if (problems.length > 40) console.error(`  … y ${problems.length - 40} más`);
    process.exit(1);
  }

  console.log(`Enlaces internos verificados: ${checked} en ${pages.length} páginas, sin rotos.`);
}

await main();
