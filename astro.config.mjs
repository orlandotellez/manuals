// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { remarkChapterLinks } from './src/lib/remark-chapter-links';
import { remarkLeadingHeading } from './src/lib/remark-leading-heading';
import { rehypeCodeBlocks } from './src/lib/rehype-code-blocks';
import { rehypeTableWrap } from './src/lib/rehype-table-wrap';

// Deployment is not wired yet (S8): the canonical origin comes from the
// environment and local builds fall back to the dev server, so no link in the
// generated HTML points at a host that does not exist.
const site = process.env.MANUALS_SITE_URL ?? 'http://localhost:4321';

export default defineConfig({
  site,
  build: {
    inlineStylesheets: 'auto',
  },
  markdown: {
    // The manuals are Markdown only. Everything the reading experience needs
    // beyond CommonMark is derived at build time from the source, so a chapter
    // stays a plain file an author can edit without touching a component.
    processor: unified({
      remarkPlugins: [remarkLeadingHeading, remarkChapterLinks],
      rehypePlugins: [rehypeCodeBlocks, rehypeTableWrap],
    }),
    // Code keeps two palettes as CSS variables; the site's own theme attribute
    // decides which one paints, not only the operating system.
    shikiConfig: {
      themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
      defaultColor: false,
    },
  },
});
