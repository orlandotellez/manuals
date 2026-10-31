// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
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
    // The manuals are Markdown only. The split into chapters and the rewriting of
    // links between them happen in the content loader; what is left for the
    // renderer is the chrome: one h1 per page and the leading separator.
    processor: unified({
      remarkPlugins: [remarkLeadingHeading],
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
