import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The manuals, one Markdown file per chapter (S6).
 *
 * There is deliberately no schema here: a chapter is the document an author
 * wrote, and its title, section and reading position live in the registry
 * (`src/lib/manuals.mjs`), exactly where mdBook's `SUMMARY.md` kept them. A
 * chapter therefore needs no frontmatter, and the 46 published manuals did not
 * have to be edited to move from mdBook to Astro.
 *
 * The route of a chapter is its file name: `src/content/manuals/09-…md` reads
 * at `/docs/09-…/`, so the URL of a manual survives any change of tool.
 */
const manuals = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/manuals' }),
});

export const collections = { manuals };
