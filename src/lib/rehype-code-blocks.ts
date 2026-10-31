/**
 * Code blocks get their chrome in the build, not from a script (S2).
 *
 * Each highlighted block is wrapped in a frame with its language label and a
 * copy control, so the block is complete in the static HTML and JavaScript only
 * wires the click. The manuals are mostly code: this chrome is what makes a
 * long chapter scannable.
 *
 * User rehype plugins run after the highlighter in Astro's pipeline, and the
 * highlighted `<pre>` carries its language both as a class and as a
 * `data-language` attribute, so both shapes are read here.
 */

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

/** Human label per language. Anything else is printed as authored. */
const languageLabels: Record<string, string> = {
  bash: 'bash',
  csharp: 'csharp',
  css: 'css',
  dockerfile: 'dockerfile',
  env: 'env',
  gitignore: 'gitignore',
  html: 'html',
  http: 'http',
  ini: 'ini',
  javascript: 'javascript',
  json: 'json',
  kotlin: 'kotlin',
  lua: 'lua',
  mermaid: 'mermaid',
  prisma: 'prisma',
  properties: 'properties',
  rust: 'rust',
  sql: 'sql',
  text: 'texto',
  toml: 'toml',
  ts: 'typescript',
  typescript: 'typescript',
  vim: 'vim',
  xml: 'xml',
  yaml: 'yaml',
};

/** Class tokens of an element, whatever shape the pipeline left them in. */
function classList(node: HastNode): string[] {
  const value = node.properties?.className ?? node.properties?.class;

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }

  if (typeof value === 'string') {
    return value.split(/\s+/).filter(Boolean);
  }

  return [];
}

/** Language of a code block, from the highlighter or from Markdown itself. */
function codeLanguage(node: HastNode): string | undefined {
  const attribute = node.properties?.dataLanguage;
  if (typeof attribute === 'string' && attribute) return attribute;

  for (const name of classList(node)) {
    if (name.startsWith('language-')) return name.slice('language-'.length);
  }

  return undefined;
}

function isCodeBlock(node: HastNode): boolean {
  if (node.type !== 'element' || node.tagName !== 'pre') return false;

  return codeLanguage(node) !== undefined || classList(node).includes('astro-code');
}

function wrap(pre: HastNode, language: string): HastNode {
  const label = languageLabels[language.toLowerCase()] ?? language.toLowerCase();

  return {
    type: 'element',
    tagName: 'div',
    properties: { className: ['code-block'] },
    children: [
      {
        type: 'element',
        tagName: 'div',
        // The language label and the copy button are chrome, not content: they
        // must not turn up in search excerpts.
        properties: { className: ['code-block__bar'], dataPagefindIgnore: true },
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['code-block__lang'] },
            children: [{ type: 'text', value: label }],
          },
          {
            type: 'element',
            tagName: 'button',
            properties: {
              type: 'button',
              className: ['code-block__copy'],
              dataCopy: true,
              ariaLive: 'polite',
            },
            children: [{ type: 'text', value: 'Copiar' }],
          },
        ],
      },
      pre,
    ],
  };
}

export function rehypeCodeBlocks() {
  return (tree: HastNode): void => {
    const transform = (node: HastNode): void => {
      if (!node.children) return;

      node.children = node.children.map((child) => {
        if (isCodeBlock(child)) return wrap(child, codeLanguage(child) ?? 'text');

        transform(child);
        return child;
      });
    };

    transform(tree);
  };
}
