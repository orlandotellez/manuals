/**
 * Chapter tree derived from the registry (S2, S6).
 *
 * Nothing in the navigation is authored twice: the sections, the chapters and
 * their order come from `library.mjs`, while the documents come from the
 * content collection. This module joins both and refuses to build when they
 * disagree, so a page can never link to a route that does not exist.
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import { chapters, sections, type Chapter, type Section } from './library.mjs';

export type { Chapter, Section };

export type Manual = CollectionEntry<'manuals'>;

/** A chapter of the registry with its rendered document attached. */
export type ChapterView = {
  id: string;
  title: string;
  section: Section;
  /** Reading position across the whole library, 1 based. */
  position: number;
  doc: Manual;
};

export type ChapterGroup = {
  section: Section;
  chapters: ChapterView[];
};

/** Canonical URL of a chapter, derived from its file name. */
export function chapterHref(id: string): string {
  return `/docs/${id}/`;
}

/**
 * Fail loudly when the registry and the content folder drift apart.
 *
 * Two rules, each with its own message so the failure names the exact line to
 * fix: a Markdown file without a registry entry is unreachable, and a registry
 * entry without a file is a link to nothing.
 */
function assertRegistryMatchesFiles(entries: Manual[]): void {
  const files = new Set(entries.map((entry) => entry.id));
  const registered = new Set(chapters.map((chapter) => chapter.id));

  for (const chapter of chapters) {
    if (!files.has(chapter.id)) {
      throw new Error(
        `Capítulo registrado sin archivo: "${chapter.id}" está en src/lib/library.mjs ` +
          `pero no existe src/content/manuals/${chapter.id}.md. Crea el archivo o quita la línea.`,
      );
    }
  }

  for (const entry of entries) {
    if (!registered.has(entry.id)) {
      throw new Error(
        `Manual sin registrar: "src/content/manuals/${entry.id}.md" no aparece en ` +
          `src/lib/library.mjs, así que no tiene título, sección ni posición de lectura. ` +
          `Agrégalo a \`chapters\` en la sección que le corresponda.`,
      );
    }
  }

  const known = new Set(sections.map((section) => section.id));

  for (const chapter of chapters) {
    if (!known.has(chapter.section)) {
      throw new Error(
        `Sección desconocida en el capítulo "${chapter.id}": "${chapter.section}" no está ` +
          `en \`sections\`. Usa una de: ${sections.map((section) => section.id).join(', ')}.`,
      );
    }
  }
}

/** Every chapter of the registry, in reading order, with its document. */
export async function getChapters(): Promise<ChapterView[]> {
  const entries = await getCollection('manuals');
  assertRegistryMatchesFiles(entries);

  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const bySection = new Map(sections.map((section) => [section.id, section as Section]));

  return chapters.map((chapter, index) => ({
    id: chapter.id,
    title: chapter.title,
    section: bySection.get(chapter.section) as Section,
    position: index + 1,
    doc: byId.get(chapter.id) as Manual,
  }));
}

/**
 * Chapters grouped by section, in registry order. Sections without chapters are
 * omitted, so an empty branch never reaches the navigation.
 */
export function groupChapters(items: ChapterView[]): ChapterGroup[] {
  return sections
    .map((section) => ({
      section,
      chapters: items.filter((item) => item.section.id === section.id),
    }))
    .filter((group) => group.chapters.length > 0);
}

/** Section that owns a chapter, by section id. */
export function findSection(id: string): Section | undefined {
  return sections.find((section) => section.id === id);
}

export type Neighbours = {
  previous?: ChapterView;
  next?: ChapterView;
};

/** Previous and next chapters in reading order, for the pager. */
export function getNeighbours(items: ChapterView[], id: string): Neighbours {
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) return {};

  return {
    previous: index > 0 ? items[index - 1] : undefined,
    next: index < items.length - 1 ? items[index + 1] : undefined,
  };
}

/** Totals shown on the home page and in the catalog header. */
export function getLibrarySize(items: ChapterView[]) {
  return {
    chapters: items.length,
    sections: groupChapters(items).length,
  };
}
