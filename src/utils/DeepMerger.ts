import { isObject } from './TypeGuards.js';

export class DeepMerger {
  /**
   * Deep merge multiple objects, preserving provenance.
   * Arrays are concatenated, objects are merged recursively.
   */
  static merge<T extends Record<string, unknown>>(...objects: T[]): T {
    if (objects.length === 0) return {} as T;
    if (objects.length === 1) return objects[0] as T;

    const result: Record<string, unknown> = {};

    for (const obj of objects) {
      if (!obj) continue;
      for (const [key, value] of Object.entries(obj)) {
        const existing = result[key];

        if (isObject(existing) && isObject(value)) {
          result[key] = this.merge(existing as Record<string, unknown>, value as Record<string, unknown>);
        } else if (Array.isArray(existing) && Array.isArray(value)) {
          result[key] = [...existing, ...value];
        } else if (existing === undefined) {
          result[key] = value;
        }
        // If existing exists and new is not undefined, keep existing unless it's nullish and new has value
        else if (existing == null && value != null) {
          result[key] = value;
        }
      }
    }

    return result as T;
  }

  /**
   * Merges extraction results by confidence - highest confidence wins
   */
  static mergeByConfidence<T>(candidates: readonly { value: T; confidence: number }[]): T | null {
    if (candidates.length === 0) return null;
    const sorted = [...candidates].sort((a, b) => b.confidence - a.confidence);
    return sorted[0]?.value ?? null;
  }
}
