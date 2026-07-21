import { describe, it, expect } from 'vitest';
import { UrlUtils } from '../../../src/utils/UrlUtils.js';

describe('UrlUtils', () => {
  it('normalizes protocol-relative', () => {
    expect(UrlUtils.normalize('//ae01.alicdn.com/test.jpg')).toBe('https://ae01.alicdn.com/test.jpg');
  });

  it('makes canonical URL', () => {
    expect(UrlUtils.makeCanonical('123')).toBe('https://www.aliexpress.com/item/123.html');
  });

  it('ensures https', () => {
    expect(UrlUtils.ensureHttps('//a.com')).toBe('https://a.com');
    expect(UrlUtils.ensureHttps('http://a.com')).toBe('https://a.com');
  });

  it('detects aliexpress image', () => {
    expect(UrlUtils.isAliExpressImage('https://ae01.alicdn.com/test.jpg')).toBe(true);
  });
});
