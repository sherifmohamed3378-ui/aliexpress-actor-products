import { describe, it, expect } from 'vitest';
import { UrlNormalizer } from '../../../src/normalizers/UrlNormalizer.js';

describe('UrlNormalizer', () => {
  it('normalizes protocol-relative URLs', () => {
    expect(UrlNormalizer.normalize('//ae01.alicdn.com/test.jpg')).toBe('https://ae01.alicdn.com/test.jpg');
  });

  it('normalizes absolute URLs', () => {
    expect(UrlNormalizer.normalize('https://example.com')).toBe('https://example.com');
  });

  it('returns null for empty', () => {
    expect(UrlNormalizer.normalize('')).toBeNull();
    expect(UrlNormalizer.normalize(null)).toBeNull();
  });

  it('normalizes array deduplicating', () => {
    const urls = UrlNormalizer.normalizeArray(['//a.com/1.jpg', 'https://a.com/1.jpg', '//a.com/2.jpg']);
    expect(urls).toEqual(['https://a.com/1.jpg', 'https://a.com/2.jpg']);
  });
});
