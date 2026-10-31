/**
 * Split one manual into chapters (S13).
 *
 * A manual is one Markdown file with many sections. The site serves one page per
 * section, so the file has to be cut without touching the prose: no line of a
 * manual is edited, which is what kept the mdBook content usable through the
 * first migration.
 *
 * The cut follows what the author did, not a fixed level: most manuals mark
 * sections with `##`, but three of them (`03-sqlx`, `04-redis`,
 * `33-manual-backups-postgresql`) use `#` for the same thing. The shallowest
 * level that repeats is the level that means "chapter" in that file.
 *
 * Two things are dropped on purpose: the manual's own leading title (the layout
 * prints it) and sections named "Índice", whose only content is the list of
 * chapters the left column already shows.
 *
 * Everything here is fence-aware: a `##` inside a code block is sample code, not
 * a heading, and the manuals are full of those.
 */

import GithubSlugger from 'github-slugger';

const FENCE = /^\s*(?:```|~~~)/;
const HEADING = /^(#{1,6})\s+(.+)$/;
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const DESTINATION = /\]\(([^)\s]+)\)/g;
const INDEX_SECTION = /^indice$/i;

/** Heading text folded to ASCII, to compare titles the way a reader would. */
const fold = (text) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '');

/** Heading text without the inline Markdown that cannot live in a link or title. */
export function plainText(markdown) {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Call `visit` for every line that is not inside a fenced code block. */
function eachContentLine(lines, visit) {
  let fence = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (FENCE.test(line)) {
      fence = !fence;
      continue;
    }

    if (fence) continue;

    visit(line, index);
  }
}

/** Drop blank lines and separator rules from both ends of a fragment. */
function trimFragment(lines) {
  let start = 0;
  let end = lines.length;

  const empty = (line) => line.trim() === '' || RULE.test(line);

  while (start < end && empty(lines[start])) start += 1;
  while (end > start && empty(lines[end - 1])) end -= 1;

  return lines.slice(start, end);
}

/**
 * @param {string} source Markdown of one manual.
 * @returns {{
 *   preamble: string,
 *   chapters: { slug: string, title: string, body: string }[],
 *   anchors: Map<string, { chapter: string | null, slug: string }>,
 * }}
 */
export function splitManual(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');

  const headings = [];
  eachContentLine(lines, (line, index) => {
    const match = HEADING.exec(line);
    if (match) headings.push({ index, depth: match[1].length, text: match[2].trim() });
  });

  // The manual's own title, if it opens with one. It is not a chapter.
  const title = headings[0]?.depth === 1 ? headings[0] : null;
  const body = title ? headings.slice(1) : headings;

  // The level that repeats is the level the author used for sections.
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const heading of body) if (heading.depth <= 3) counts[heading.depth] += 1;

  const sectionDepth = counts[1] >= 2 ? 1 : counts[2] >= 2 ? 2 : counts[3] >= 2 ? 3 : 0;

  if (sectionDepth === 0) {
    throw new Error(
      'Este manual no tiene secciones reconocibles: necesita al menos dos títulos del mismo nivel ' +
        '(## o #) para poder partirlo en capítulos.',
    );
  }

  const shift = sectionDepth > 2 ? sectionDepth - 2 : 0;
  const sections = body.filter((heading) => heading.depth === sectionDepth);

  // One slugger for chapter URLs, one per chapter for the heading ids inside it,
  // and one for the anchors the author wrote against the whole file.
  const chapterSlugger = new GithubSlugger();
  const documentSlugger = new GithubSlugger();

  const chapters = [];
  const anchors = new Map();

  const preambleLines = [];

  if (title) {
    for (let index = 0; index < sections[0].index; index += 1) {
      if (index === title.index) continue;
      preambleLines.push(lines[index]);
    }
  } else {
    preambleLines.push(...lines.slice(0, sections[0]?.index ?? 0));
  }

  const plainTitle = (heading) => plainText(heading.text);

  // Every heading of the file, so a link written against the old single page can
  // be resolved to the chapter that now owns its target.
  const documentSlugs = new Map();
  for (const heading of body) {
    documentSlugs.set(heading, documentSlugger.slug(plainTitle(heading)));
  }

  for (let position = 0; position < sections.length; position += 1) {
    const section = sections[position];
    const next = sections[position + 1];
    const sectionLines = lines.slice(section.index + 1, next?.index ?? lines.length);
    const sectionTitle = plainTitle(section);
    const isIndex = INDEX_SECTION.test(fold(sectionTitle));

    // The section's own headings, slugged as they will be on their own page.
    const innerSlugger = new GithubSlugger();
    const innerSlugs = new Map();

    for (const heading of body) {
      if (heading.index <= section.index) continue;
      if (next && heading.index >= next.index) break;
      innerSlugs.set(heading, innerSlugger.slug(plainTitle(heading)));
    }

    if (isIndex) {
      // The index is navigation, and the left column is that index now.
      anchors.set(documentSlugs.get(section), { chapter: null, slug: '' });
      for (const heading of innerSlugs.keys()) {
        anchors.set(documentSlugs.get(heading), { chapter: null, slug: '' });
      }
      continue;
    }

    const slug = chapterSlugger.slug(sectionTitle);

    for (const [heading, innerSlug] of innerSlugs) {
      anchors.set(documentSlugs.get(heading), { chapter: slug, slug: innerSlug });
    }

    // The chapter title becomes the page heading, so it is not an anchor target.
    anchors.set(documentSlugs.get(section), { chapter: slug, slug: '' });

    // Inside the chapter every heading drops the levels the cut removed, so the
    // page reads h1 (title) then h2 and h3, never skipping a level.
    const shifted = [];
    let insideFence = false;

    for (const line of sectionLines) {
      if (FENCE.test(line)) {
        insideFence = !insideFence;
        shifted.push(line);
        continue;
      }

      if (insideFence) {
        shifted.push(line);
        continue;
      }

      const match = HEADING.exec(line);
      const depth = match ? match[1].length : 0;

      if (!match || depth <= sectionDepth) {
        shifted.push(line);
        continue;
      }

      shifted.push(`${'#'.repeat(Math.max(2, depth - shift))} ${match[2]}`);
    }

    chapters.push({
      slug,
      title: sectionTitle,
      body: trimFragment(shifted).join('\n'),
      order: chapters.length + 1,
    });
  }

  return {
    preamble: trimFragment(preambleLines).join('\n'),
    chapters,
    anchors,
  };
}

/**
 * Rewrite the link destinations of one fragment so they point at the pages that
 * exist now (S13).
 *
 * - `#anchor` written against the old single page becomes the chapter that owns
 *   that heading, plus the heading id inside it.
 * - `./other-manual.md#anchor` becomes that manual's chapter.
 * - Anything unknown is left exactly as it was: the build's link audit is what
 *   reports a destination that does not exist, and it must not be papered over
 *   here.
 *
 * @param {string} fragment
 * @param {{
 *   manual: string,
 *   chapter: string | null,
 *   anchors: Map<string, { chapter: string | null, slug: string }>,
 *   catalog: Map<string, Map<string, { chapter: string | null, slug: string }>>,
 * }} context
 */
export function rewriteLinks(fragment, { manual, chapter, anchors, catalog }) {
  const lines = fragment.split('\n');
  const rewritten = [];
  let fence = false;

  const chapterUrl = (manualId, slug) => (slug ? `/docs/${manualId}/${slug}/` : `/docs/${manualId}/`);

  const resolveAnchor = (manualId, anchor) => {
    const map = manualId === manual ? anchors : catalog.get(manualId);
    if (!map) return null;

    const decoded = decodeURIComponent(anchor);
    const hit = map.get(decoded);
    if (!hit) return null;

    const slug = hit.slug && manualId === manual && hit.chapter === chapter ? '' : hit.slug;
    return { chapter: hit.chapter, slug };
  };

  for (const line of lines) {
    if (FENCE.test(line)) {
      fence = !fence;
      rewritten.push(line);
      continue;
    }

    if (fence) {
      rewritten.push(line);
      continue;
    }

    rewritten.push(
      line.replace(DESTINATION, (whole, destination) => {
        if (/^[a-z][a-z0-9+.-]*:/i.test(destination) || destination.startsWith('/')) return whole;

        if (destination.startsWith('#')) {
          const hit = resolveAnchor(manual, destination.slice(1));
          if (!hit || !hit.chapter) return whole;

          const suffix = hit.slug ? `#${hit.slug}` : '';
          return `](${chapterUrl(manual, hit.chapter)}${suffix})`;
        }

        const crossManual = /^\.?\/?([\w.-]+)\.md(?:#(.*))?$/.exec(destination);
        if (!crossManual) return whole;

        const [, otherManual, anchor] = crossManual;
        const map = catalog.get(otherManual);
        if (!map) return whole;

        if (!anchor) return `](${chapterUrl(otherManual, '')})`;

        const hit = resolveAnchor(otherManual, anchor);
        if (!hit || !hit.chapter) return `](${chapterUrl(otherManual, '')})`;

        return `](${chapterUrl(otherManual, hit.chapter)}${hit.slug ? `#${hit.slug}` : ''})`;
      }),
    );
  }

  return rewritten.join('\n');
}
