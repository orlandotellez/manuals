/**
 * Normalise the outline of one page (S13).
 *
 * The content loader already cut the manual and shifted the headings of every
 * chapter, so a page body arrives with exactly the levels it should have. Two
 * leftovers are cleaned here, both of them consequences of the split:
 *
 * - A chapter that opened with a title also opened with a rule under it; now that
 *   the title is the page heading, that rule would be the first thing on the page.
 * - A manual may still use `#` inside a chapter (three of them mark sections with
 *   it). On a page the title is the only h1, so any remaining h1 becomes h2.
 */

type MdastNode = {
  type: string;
  depth?: number;
  children?: MdastNode[];
};

function demoteH1(node: MdastNode): void {
  if (node.type === 'heading' && node.depth === 1) {
    node.depth = 2;
  }

  for (const child of node.children ?? []) demoteH1(child);
}

export function remarkLeadingHeading() {
  return (tree: MdastNode): void => {
    const children = tree.children ?? [];

    while (children[0]?.type === 'thematicBreak') children.shift();

    tree.children = children;

    for (const child of children) demoteH1(child);
  };
}
