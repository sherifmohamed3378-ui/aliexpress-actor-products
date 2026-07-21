import { describe, it, expect } from 'vitest';
import { SafeJsonParser } from '../../../src/utils/SafeJsonParser.js';

describe('SafeJsonParser', () => {
  it('parses valid JSON', () => {
    expect(SafeJsonParser.parse('{"a":1}')).toEqual({ a: 1 });
  });

  it('extracts JSON substring from JS assignment', () => {
    const input = 'window.runParams = {"productId":"123"};';
    const parsed = SafeJsonParser.parse(input);
    expect((parsed as { productId: string }).productId).toBe('123');
  });

  it('fixes single quotes and trailing commas', () => {
    const input = "{'a':1,}";
    const parsed = SafeJsonParser.parse(input);
    expect((parsed as { a: number }).a).toBe(1);
  });

  it('returns null for invalid', () => {
    expect(SafeJsonParser.parse('')).toBeNull();
    expect(SafeJsonParser.parse('not json {')).toBeNull();
  });

  it('tryParseEmbeddedInScript finds runParams', () => {
    const script = 'window.runParams = {"productId":"123","subject":"test"};';
    const results = SafeJsonParser.tryParseEmbeddedInScript(script);
    expect(results.length).toBeGreaterThan(0);
  });
});
