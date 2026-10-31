/**
 * Library tree derived from the registry and the content collection (S2, S13).
 *
 * The registry (`library.mjs`) says which manuals exist, in which section and in
 * which order. The loader turns every manual into pages: a cover plus its
 * chapters. This module joins both and refuses to build when they disagree, so a
 * page can never link to a route that does not exist.
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import { chapters as registry, sections, type Section } from './library.mjs';

export type { Section };

export type Page = CollectionEntry<'manuals'>;

/** One manual: its cover, its chapters, and where it sits in the library. */
export type ManualView = {
  id: string;
  title: string;
  section: Section;
  /** Reading position across the library, 1 based. */
  position: number;
  cover: Page;
  chapters: Page[];
};

/** URL of a manual's cover. */
export function manualHref(id: string): string {
  return `/docs/${id}/`;
}

/** URL of one chapter. */
export function chapterHref(manual: string, slug: string): string {
  return `/docs/${manual}/${slug}/`;
}

/** URL of the page a reader lands on: the chapter, or the cover of a manual. */
export function pageHref(manual: string, page: Page): string {
  return page.data.kind === 'chapter' ? chapterHref(manual, page.data.slug) : manualHref(manual);
}

/**
 * Fail loudly when the registry and the content collection drift apart: a
 * registered manual without pages is a broken link in the catalog, and a page
 * whose manual is not registered cannot be placed in any section.
 */
function assertPagesMatchRegistry(pages: Page[]): void {
  const known = new Set(registry.map((manual) => manual.id));
  const covers = new Set(
    pages.filter((page) => page.data.kind === 'overview').map((page) => page.data.manual),
  );

  for (const manual of registry) {
    if (!covers.has(manual.id)) {
      throw new Error(
        `Manual sin portada: "${manual.id}" no produjo la página /docs/${manual.id}/. ` +
          'Revisa que su archivo en src/content/manuals/ tenga contenido antes del primer capítulo.',
      );
    }
  }

  for (const page of pages) {
    if (!known.has(page.data.manual)) {
      throw new Error(
        `Página sin manual registrado: "${page.id}" viene de "${page.data.manual}", que no está ` +
          'en src/lib/library.mjs. Agrégalo al registro antes de publicarlo.',
      );
    }
  }
}

/** Every manual with its pages, in registry order. */
export async function getManuals(): Promise<ManualView[]> {
  const pages = await getCollection('manuals');
  assertPagesMatchRegistry(pages);

  return registry.map((registered, index) => {
    const own = pages.filter((page) => page.data.manual === registered.id);

    return {
      id: registered.id,
      title: registered.title,
      section: sections.find((section) => section.id === registered.section) as Section,
      position: index + 1,
      cover: own.find((page) => page.data.kind === 'overview') as Page,
      chapters: own
        .filter((page) => page.data.kind === 'chapter')
        .sort((a, b) => a.data.order - b.data.order),
    };
  });
}

/** One manual by id, for a page that already knows which one it belongs to. */
export async function getManual(id: string): Promise<ManualView | undefined> {
  return (await getManuals()).find((manual) => manual.id === id);
}

export type ManualGroup = {
  section: Section;
  manuals: ManualView[];
};

/** Manuals grouped by section, in registry order. Empty sections are dropped. */
export function groupManuals(manuals: ManualView[]): ManualGroup[] {
  return sections
    .map((section) => ({
      section,
      manuals: manuals.filter((manual) => manual.section.id === section.id),
    }))
    .filter((group) => group.manuals.length > 0);
}

/** Totals shown on the home page and in the catalog header. */
export function getLibrarySize(manuals: ManualView[]) {
  return {
    manuals: manuals.length,
    chapters: manuals.reduce((total, manual) => total + manual.chapters.length, 0),
    sections: groupManuals(manuals).length,
  };
}

/** Previous and next chapter of the same manual, for the pager. */
export function getChapterNeighbours(manual: ManualView, slug: string) {
  const index = manual.chapters.findIndex((chapter) => chapter.data.slug === slug);

  return {
    previous: index > 0 ? manual.chapters[index - 1] : undefined,
    next: index >= 0 && index < manual.chapters.length - 1 ? manual.chapters[index + 1] : undefined,
  };
}
