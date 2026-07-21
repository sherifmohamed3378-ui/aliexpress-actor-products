import { describe, it, expect } from 'vitest';
import { TextNormalizer } from '../../../src/normalizers/TextNormalizer.js';

describe('TextNormalizer', () => {
  it('normalizes string with extra spaces', () => {
    expect(TextNormalizer.normalize('  hello   world  ')).toBe('hello world');
  });

  it('returns null for empty', () => {
    expect(TextNormalizer.normalize('   ')).toBeNull();
    expect(TextNormalizer.normalize(null)).toBeNull();
    expect(TextNormalizer.normalize(undefined)).toBeNull();
  });

  it('normalizes object wrappers', () => {
    expect(TextNormalizer.normalize({ text: '  test ' } as unknown)).toBe('test');
    expect(TextNormalizer.normalize({ value: 'value' } as unknown)).toBe('value');
    expect(TextNormalizer.normalize({ name: 'name' } as unknown)).toBe('name');
  });

  it('normalizes array', () => {
    const result = TextNormalizer.normalizeArray(['  a ', null, ' b ', '' as unknown as string]);
    expect(result).toEqual(['a', 'b']);
  });
});
