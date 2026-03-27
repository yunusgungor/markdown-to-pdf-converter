export const PAGE_BREAK_TOKEN = '<<<PAGE_BREAK>>>';
export const KEEP_WITH_NEXT_TOKEN = '<<<KEEP_WITH_NEXT>>>';

export type MarkdownSection =
  | { type: 'section'; content: string; keepWithNext: boolean }
  | { type: 'page-break' };

export const splitMarkdownIntoBlocks = (content: string): string[] => {
  const lines = content.split(/\r?\n/);
  const blocks: string[] = [];
  let currentBlock: string[] = [];
  let inCodeFence = false;

  const flushBlock = () => {
    const block = currentBlock.join('\n').trim();
    if (block) {
      blocks.push(block);
    }
    currentBlock = [];
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('```')) {
      inCodeFence = !inCodeFence;
    }

    if (
      !inCodeFence &&
      (trimmedLine === PAGE_BREAK_TOKEN || trimmedLine === `<<<PAGE_BREAK>>>`)
    ) {
      flushBlock();
      blocks.push(PAGE_BREAK_TOKEN);
      continue;
    }

    if (
      !inCodeFence &&
      (trimmedLine === KEEP_WITH_NEXT_TOKEN ||
        trimmedLine === `<<<KEEP_WITH_NEXT>>>`)
    ) {
      flushBlock();
      blocks.push(KEEP_WITH_NEXT_TOKEN);
      continue;
    }

    if (!inCodeFence && trimmedLine === '') {
      flushBlock();
      continue;
    }

    currentBlock.push(line);
  }

  flushBlock();

  return blocks;
};

export const createMarkdownSections = (content: string): MarkdownSection[] => {
  const safeContent = content.trim() ? content : '_Doküman boş._';
  const blocks = splitMarkdownIntoBlocks(safeContent);
  const sections: MarkdownSection[] = [];
  let keepWithNext = false;

  for (const block of blocks) {
    if (block === PAGE_BREAK_TOKEN || block === `<<<PAGE_BREAK>>>`) {
      sections.push({ type: 'page-break' });
      keepWithNext = false;
      continue;
    }

    if (block === KEEP_WITH_NEXT_TOKEN || block === `<<<KEEP_WITH_NEXT>>>`) {
      keepWithNext = true;
      continue;
    }

    const isHeading = /^#{1,6}\s/.test(block);
    sections.push({
      type: 'section',
      content: block,
      keepWithNext: keepWithNext || isHeading,
    });
    keepWithNext = false;
  }

  return sections.length > 0
    ? sections
    : [{ type: 'section', content: safeContent, keepWithNext: false }];
};