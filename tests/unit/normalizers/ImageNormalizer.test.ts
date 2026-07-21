import { describe, it, expect } from 'vitest';
import { ImageNormalizer } from '../../../src/normalizers/ImageNormalizer.js';

describe('ImageNormalizer', () => {
  it('normalizes string URL', () => {
    const img = ImageNormalizer.normalize('//ae01.alicdn.com/kf/1.jpg', 'gallery');
    expect(img?.url).toBe('https://ae01.alicdn.com/kf/1.jpg');
    expect(img?.type).toBe('gallery');
  });

  it('normalizes object with imagePath', () => {
    const img = ImageNormalizer.normalize({ imagePath: '//ae01.alicdn.com/kf/2.jpg' } as unknown);
    expect(img?.url).toContain('ae01.alicdn.com');
  });

  it('normalizes array', () => {
    const arr = ImageNormalizer.normalizeArray(['//a.com/1.jpg', '//a.com/2.jpg']);
    expect(arr.length).toBe(2);
  });

  it('deduplicates', () => {
    const arr = ImageNormalizer.normalizeArray(['//a.com/1.jpg', '//a.com/1.jpg']);
    expect(arr.length).toBe(1);
  });

  it('returns null for empty', () => {
    expect(ImageNormalizer.normalize(null)).toBeNull();
  });
});
