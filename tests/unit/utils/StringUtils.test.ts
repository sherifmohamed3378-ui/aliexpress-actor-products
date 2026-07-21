import { describe, it, expect } from 'vitest';
import { StringUtils } from '../../../src/utils/StringUtils.js';

describe('StringUtils', () => {
  it('cleans whitespace', () => {
    expect(StringUtils.clean('  a   b  ')).toBe('a b');
  });

  it('extracts product id from URL', () => {
    expect(StringUtils.extractProductIdFromUrl('https://www.aliexpress.com/item/1005006000000000.html')).toBe('1005006000000000');
    expect(StringUtils.extractProductIdFromUrl('https://www.aliexpress.com/item/123.html?productId=456')).toBe('123');
  });

  it('detects html', () => {
    expect(StringUtils.isHtml('<div>test</div>')).toBe(true);
    expect(StringUtils.isHtml('plain text')).toBe(false);
  });

  it('strips html', () => {
    expect(StringUtils.stripHtml('<p>hello <b>world</b></p>')).toBe('hello world');
  });
});
