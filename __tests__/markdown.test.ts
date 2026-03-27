import { describe, it, expect } from 'vitest';
import { splitMarkdownIntoBlocks, createMarkdownSections, PAGE_BREAK_TOKEN, KEEP_WITH_NEXT_TOKEN } from '../utils/markdown';

describe('splitMarkdownIntoBlocks', () => {
  it('should return empty array for empty string', () => {
    const result = splitMarkdownIntoBlocks('');
    expect(result).toEqual([]);
  });

  it('should return single block for single paragraph', () => {
    const result = splitMarkdownIntoBlocks('Hello world');
    expect(result).toEqual(['Hello world']);
  });

  it('should split multiple paragraphs separated by blank lines', () => {
    const input = 'First paragraph\n\nSecond paragraph\n\nThird paragraph';
    const result = splitMarkdownIntoBlocks(input);
    expect(result).toEqual(['First paragraph', 'Second paragraph', 'Third paragraph']);
  });

  it('should not split content inside code blocks', () => {
    const input = '```\ncode block\ncontent\n```\n\nRegular paragraph';
    const result = splitMarkdownIntoBlocks(input);
    expect(result).toEqual(['```\ncode block\ncontent\n```', 'Regular paragraph']);
  });

  it('should handle PAGE_BREAK_TOKEN and separate blocks', () => {
    const input = 'First paragraph\n<<<PAGE_BREAK>>>\nSecond paragraph';
    const result = splitMarkdownIntoBlocks(input);
    expect(result).toEqual(['First paragraph', PAGE_BREAK_TOKEN, 'Second paragraph']);
  });

  it('should handle PAGE_BREAK_TOKEN with aliases', () => {
    const input = 'First paragraph\n<<<PAGE_BREAK>>>\nSecond paragraph';
    const result = splitMarkdownIntoBlocks(input);
    expect(result).toHaveLength(3);
    expect(result[1]).toBe(PAGE_BREAK_TOKEN);
  });

  it('should handle KEEP_WITH_NEXT_TOKEN and separate blocks', () => {
    const input = 'First paragraph\n<<<KEEP_WITH_NEXT>>>\nSecond paragraph';
    const result = splitMarkdownIntoBlocks(input);
    expect(result).toEqual(['First paragraph', KEEP_WITH_NEXT_TOKEN, 'Second paragraph']);
  });

  it('should handle KEEP_WITH_NEXT_TOKEN with aliases', () => {
    const input = 'First paragraph\n<<<KEEP_WITH_NEXT>>>\nSecond paragraph';
    const result = splitMarkdownIntoBlocks(input);
    expect(result).toHaveLength(3);
    expect(result[1]).toBe(KEEP_WITH_NEXT_TOKEN);
  });

  it('should handle multiple tokens in sequence', () => {
    const input = 'Para1\n<<<PAGE_BREAK>>>\n<<<KEEP_WITH_NEXT>>>\nPara2';
    const result = splitMarkdownIntoBlocks(input);
    expect(result).toEqual(['Para1', PAGE_BREAK_TOKEN, KEEP_WITH_NEXT_TOKEN, 'Para2']);
  });

  it('should trim whitespace from blocks', () => {
    const input = '  First paragraph  \n\n  Second paragraph  ';
    const result = splitMarkdownIntoBlocks(input);
    expect(result).toEqual(['First paragraph', 'Second paragraph']);
  });
});

describe('createMarkdownSections', () => {
  it('should return single section for empty content', () => {
    const result = createMarkdownSections('');
    expect(result).toEqual([{ type: 'section', content: '_Doküman boş._', keepWithNext: false }]);
  });

  it('should return single section for single paragraph', () => {
    const result = createMarkdownSections('Hello world');
    expect(result).toEqual([{ type: 'section', content: 'Hello world', keepWithNext: false }]);
  });

  it('should create multiple sections for multiple paragraphs', () => {
    const input = 'First paragraph\n\nSecond paragraph';
    const result = createMarkdownSections(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'section', content: 'First paragraph', keepWithNext: false });
    expect(result[1]).toEqual({ type: 'section', content: 'Second paragraph', keepWithNext: false });
  });

  it('should create page-break sections', () => {
    const input = 'First\n<<<PAGE_BREAK>>>\nSecond';
    const result = createMarkdownSections(input);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'section', content: 'First', keepWithNext: false });
    expect(result[1]).toEqual({ type: 'page-break' });
    expect(result[2]).toEqual({ type: 'section', content: 'Second', keepWithNext: false });
  });

  it('should handle keep-with-next correctly', () => {
    const input = 'First\n<<<KEEP_WITH_NEXT>>>\nSecond';
    const result = createMarkdownSections(input);
    expect(result).toHaveLength(2);
    const first = result[0] as { type: 'section'; content: string; keepWithNext: boolean };
    const second = result[1] as { type: 'section'; content: string; keepWithNext: boolean };
    // KEEP_WITH_NEXT applies to the NEXT section, not the current one
    expect(first.keepWithNext).toBe(false);
    expect(second.keepWithNext).toBe(true);
  });

  it('should mark headings with keepWithNext true', () => {
    const input = '# Heading\n\nParagraph';
    const result = createMarkdownSections(input);
    const firstSection = result[0] as { type: 'section'; content: string; keepWithNext: boolean };
    const secondSection = result[1] as { type: 'section'; content: string; keepWithNext: boolean };
    expect(firstSection.keepWithNext).toBe(true);
    expect(secondSection.keepWithNext).toBe(false);
  });

  it('should handle all heading levels', () => {
    const input = '# H1\n\n## H2\n\n### H3';
    const result = createMarkdownSections(input);
    const sections = result.map(s => s as { type: 'section'; content: string; keepWithNext: boolean });
    expect(sections[0].keepWithNext).toBe(true);
    expect(sections[1].keepWithNext).toBe(true);
    expect(sections[2].keepWithNext).toBe(true);
  });

  it('should handle combination of tokens and headings', () => {
    const input = '# Title\n\nPara1\n\n<<<PAGE_BREAK>>>\n\nPara2\n\n<<<KEEP_WITH_NEXT>>>\n\nPara3';
    const result = createMarkdownSections(input);
    const first = result[0] as { type: 'section'; content: string; keepWithNext: boolean };
    const second = result[1] as { type: 'section'; content: string; keepWithNext: boolean };
    const fourth = result[3] as { type: 'section'; content: string; keepWithNext: boolean };
    const fifth = result[4] as { type: 'section'; content: string; keepWithNext: boolean };
    expect(first.keepWithNext).toBe(true);
    expect(second.keepWithNext).toBe(false);
    expect(result[2].type).toBe('page-break');
    expect(fourth.keepWithNext).toBe(false);
    expect(fifth.keepWithNext).toBe(true);
  });

  it('should handle whitespace-only content gracefully', () => {
    const result = createMarkdownSections('   ');
    expect(result).toEqual([{ type: 'section', content: '_Doküman boş._', keepWithNext: false }]);
  });
});