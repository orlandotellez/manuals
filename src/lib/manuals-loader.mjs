/**
 * Content loader: one manual file becomes one page per chapter (S13).
 *
 * Astro's glob loader maps one file to one entry, which is exactly what a manual
 * is not: a manual is a book, and a book is read chapter by chapter. This loader
 * cuts each file with `chapter-split.mjs` and stores one entry per page — the
 * manual's cover (its preamble) at `<manual>`, and one entry per chapter at
 * `<manual>/<slug>`.
 *
 * It runs in two passes because links between manuals need the whole library:
 * first every file is split and its anchors are collected, then every fragment is
 * rewritten against that catalog and stored.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { splitManual, rewriteLinks } from './chapter-split.mjs';
import { chapters as registry, sectionIds } from './library.mjs';

const contentDir = fileURLToPath(new URL('../content/manuals/', import.meta.url));
const registryIds = new Set(registry.map((manual) => manual.id));

/** Manual id → registry entry, so one loop can validate and decorate entries. */
const registryById = new Map(registry.map((manual) => [manual.id, manual]));

async function readManuals() {
  let names;

  try {
    names = (await readdir(contentDir)).filter((name) => name.endsWith('.md'));
  } catch {
    throw new Error(
      `No existe el contenido de los manuales en ${contentDir}. ` +
        'Los archivos Markdown tienen que vivir en src/content/manuals/.',
    );
  }

  const manuals = new Map();

  for (const name of names.sort()) {
    const id = name.slice(0, -'.md'.length);
    const entry = registryById.get(id);

    if (!entry) {
      throw new Error(
        `Manual sin registrar: "src/content/manuals/${name}" no aparece en src/lib/library.mjs, ` +
          'así que no tiene título, sección ni posición en la biblioteca.',
      );
    }

    manuals.set(id, splitManual(await readFile(join(contentDir, name), 'utf8')));
  }

  const missing = registry.filter((manual) => !manuals.has(manual.id));
  if (missing.length > 0) {
    throw new Error(
      `Manuales registrados sin archivo: ${missing.map((manual) => manual.id).join(', ')}. ` +
        'Crea su Markdown en src/content/manuals/ o quita la línea del registro.',
    );
  }

  return manuals;
}

export function manualChaptersLoader() {
  let watching = false;
  let pending = null;

  const load = async ({ store, parseData, generateDigest, renderMarkdown, logger, watcher }) => {
    const started = Date.now();
    const manuals = await readManuals();
    const catalog = new Map([...manuals].map(([id, split]) => [id, split.anchors]));

    store.clear();
    let chapterCount = 0;

    for (const [manual, split] of manuals) {
      const registered = registryById.get(manual);

      if (!sectionIds.includes(registered.section)) {
        throw new Error(
          `Sección desconocida en "${manual}": "${registered.section}" no está en library.mjs.`,
        );
      }

      const filePath = `src/content/manuals/${manual}.md`;
      const cover = rewriteLinks(split.preamble, {
        manual,
        chapter: null,
        anchors: split.anchors,
        catalog,
      });

      const coverRendered = await renderMarkdown(cover, { fileURL: pathToFileURL(join(contentDir, `${manual}.md`)) });

      store.set({
        id: manual,
        data: await parseData({
          id: manual,
          data: {
            kind: 'overview',
            manual,
            section: registered.section,
            title: registered.title,
            slug: '',
            order: 0,
          },
          filePath,
        }),
        body: cover,
        rendered: coverRendered,
        digest: generateDigest(cover),
        filePath,
      });

      for (const chapter of split.chapters) {
        const id = `${manual}/${chapter.slug}`;
        const body = rewriteLinks(chapter.body, {
          manual,
          chapter: chapter.slug,
          anchors: split.anchors,
          catalog,
        });

        const rendered = await renderMarkdown(body, {
          fileURL: pathToFileURL(join(contentDir, `${manual}.md`)),
        });

        store.set({
          id,
          data: await parseData({
            id,
            data: {
              kind: 'chapter',
              manual,
              section: registered.section,
              title: chapter.title,
              slug: chapter.slug,
              order: chapter.order,
            },
            filePath,
          }),
          body,
          rendered,
          digest: generateDigest(body),
          filePath,
        });

        chapterCount += 1;
      }
    }

    logger.info(
      `${manuals.size} manuales y ${chapterCount} capítulos en ${Date.now() - started} ms`,
    );

    // In development, editing a manual has to re-cut it: the whole collection is
    // derived from the file, so any change re-runs the loader once, debounced.
    if (watcher && !watching) {
      watching = true;

      const reload = (path) => {
        if (!path.startsWith(contentDir)) return;
        if (pending) clearTimeout(pending);
        pending = setTimeout(
          () => void load({ store, parseData, generateDigest, renderMarkdown, logger, watcher }),
          120,
        );
      };

      watcher.on('change', reload);
      watcher.on('add', reload);
      watcher.on('unlink', reload);
    }
  };

  return { name: 'manuals-chapters', load };
}
