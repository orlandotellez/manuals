/**
 * Normalise the document outline (S2, S6).
 *
 * Every published manual opens with an `#` title, and the layout already prints
 * the chapter title from the registry as the page heading. Rendering both would
 * put two h1s on one page and repeat the title twice on screen, so the leading
 * h1 is removed here, before the renderer collects headings: the in-page table
 * of contents therefore starts at the first real section, exactly like it did
 * under mdBook, where the title also lived in the theme chrome.
 *
 * A few manuals also use `#` for the sections below the title (the author wrote
 * the whole file at one level). Those become h2, so a page keeps exactly one h1
 * — the page title — and their sections reach the table of contents instead of
 * being skipped by it. Deeper levels are untouched: a well-formed manual keeps
 * its h2/h3 hierarchy.
 *
 * Only the top of the document is inspected for removal. A chapter that opens
 * with a paragraph, a list or an `##` heading keeps everything it wrote.
 */

type MdastNode = {
  type: string;
  depth?: number;
  children?: MdastNode[];
};

function demoteStrayH1(node: MdastNode): void {
  if (node.type === 'heading' && node.depth === 1) {
    node.depth = 2;
  }

  for (const child of node.children ?? []) demoteStrayH1(child);
}

export function remarkLeadingHeading() {
  return (tree: MdastNode): void => {
    const children = tree.children ?? [];
    const [first] = children;
    if (!first) return;

    if (first.type === 'heading' && first.depth === 1) {
      children.shift();
    }

    // The manuals that opened with a title also opened with a rule under it
    // (`# Título` then `---`). Once the title is gone, that rule would be the
    // first thing on the page, so it goes with it.
    while (children[0]?.type === 'thematicBreak') children.shift();

    tree.children = children;

    for (const child of children) demoteStrayH1(child);
  };
}
