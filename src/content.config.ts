import { defineCollection, z } from 'astro:content';
import { manualChaptersLoader } from './lib/manuals-loader.mjs';

/**
 * The manuals, cut into pages (S13).
 *
 * One manual file produces one entry per page: its cover (`kind: 'overview'`)
 * and one entry per chapter. The loader owns the split, so the collection only
 * has to describe what a page is, and the schema is what stops a page from
 * reaching a route without a title or a manual to belong to.
 *
 * `id` is `<manual>` for a cover and `<manual>/<chapter-slug>` for a chapter; the
 * route is derived from it, never from a slug field that could drift.
 */
const manuals = defineCollection({
  loader: manualChaptersLoader(),
  schema: z
    .object({
      kind: z.enum(['overview', 'chapter']),
      /** Manual this page belongs to: the file name in src/content/manuals. */
      manual: z.string().min(1),
      /** Section of the library, validated against library.mjs by the loader. */
      section: z.string().min(1),
      title: z.string().min(1),
      /** Chapter slug; empty on the cover. */
      slug: z.string(),
      /** Reading position inside the manual; 0 on the cover. */
      order: z.number().int().nonnegative(),
    })
    .strict(),
});

export const collections = { manuals };
