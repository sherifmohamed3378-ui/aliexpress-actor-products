import { describe, it, expect } from 'vitest';
import { CategoryNormalizer } from '../../../src/normalizers/CategoryNormalizer.js';

describe('CategoryNormalizer', () => {
  it('normalizes string category', () => {
    expect(CategoryNormalizer.normalizeCategory('Electronics')?.name).toBe('Electronics');
  });

  it('normalizes object category with id and url', () => {
    const cat = CategoryNormalizer.normalizeCategory({ name: 'Phones', id: 123, url: '/cat/phones' } as unknown);
    expect(cat?.name).toBe('Phones');
    expect(cat?.id).toBe('123');
  });

  it('normalizes breadcrumbs string', () => {
    const bc = CategoryNormalizer.normalizeBreadcrumbs('Home > Electronics > Phones');
    expect(bc?.length).toBe(3);
    expect(bc?.[0]?.name).toBe('Home');
  });

  it('normalizes breadcrumbs array', () => {
    const bc = CategoryNormalizer.normalizeBreadcrumbs([{ name: 'Home' }, { name: 'Cat' }] as unknown);
    expect(bc?.length).toBe(2);
  });

  it('returns null for invalid', () => {
    expect(CategoryNormalizer.normalizeCategory(null)).toBeNull();
    expect(CategoryNormalizer.normalizeBreadcrumbs(null)).toBeNull();
  });
});
