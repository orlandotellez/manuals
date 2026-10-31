/**
 * Internal links between manuals (S2, S6).
 *
 * The manuals were written for mdBook, where a chapter linked to its neighbour
 * with a relative path: `[enrutamiento dinámico](./36-enrutamiento-dinamico.md)`.
 * In Astro that path is not a route, so every relative `.md` link is rewritten
 * here to the chapter URL (`/docs/36-enrutamiento-dinamico/`). The source keeps
 * the short, readable form the author wrote; the build emits the real route.
 *
 * A link that names a chapter the registry does not know fails the build
 * instead of shipping a 404, and the message says which link and which file to
 * fix. External links, anchors and absolute paths are left alone.
 */

import { chapters } from './library.mjs';

type MdastNode = {
  type: string;
  url?: string;
  children?: MdastNode[];
};

/** `./36-enrutamiento-dinamico.md#seleccion` → id `36-enrutamiento-dinamico`, hash `#seleccion`. */
const relativeChapterLink = /^\.?\/?([\w.-]+)\.md(#[^#]*)?$/;

const known = new Set(chapters.map((chapter) => chapter.id));

function rewriteLinks(node: MdastNode): void {
  if (node.type === 'link' && typeof node.url === 'string') {
    const match = relativeChapterLink.exec(node.url);
    const id = match?.[1];

    if (id) {
      if (!known.has(id)) {
        throw new Error(
          `Enlace a un manual desconocido: "${node.url}" apunta a "${id}", que no está en ` +
            `src/lib/library.mjs. Corrige la ruta o registra el manual antes de publicarlo.`,
        );
      }

      node.url = `/docs/${id}/${match[2] ?? ''}`;
    }
  }

  for (const child of node.children ?? []) rewriteLinks(child);
}

export function remarkChapterLinks() {
  return (tree: MdastNode): void => {
    rewriteLinks(tree);
  };
}
