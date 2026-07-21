/**
 * SafeJsonParser.ts
 * Robust JSON parsing that handles AliExpress's malformed embedded JSON, single quotes, etc.
 */

export class SafeJsonParser {
  /**
   * Attempts multiple strategies to parse JSON.
   * Returns parsed value or null if all fail.
   */
  static parse(input: string): unknown | null {
    if (!input || typeof input !== 'string') return null;

    const trimmed = input.trim();
    if (!trimmed) return null;

    // Quick exit for non-JSON looking strings
    if (trimmed.length < 2) return null;

    // Strategy 1: Direct JSON.parse
    try {
      return JSON.parse(trimmed);
    } catch {
      // continue
    }

    // Strategy 2: Extract JSON substring (common in script tags like window.runParams = {...})
    const jsonMatch = this.extractJsonSubstring(trimmed);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch);
      } catch {
        // continue
      }
    }

    // Strategy 3: Fix single quotes and trailing commas
    try {
      const fixed = this.fixCommonIssues(trimmed);
      return JSON.parse(fixed);
    } catch {
      // continue
    }

    // Strategy 4: Try to parse as JS object literal via Function (sandboxed) - last resort
    try {
      // Only attempt if looks like object literal
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
         
        const fn = new Function(`"use strict"; return (${trimmed});`);
        return fn();
      }
    } catch {
      // ignore
    }

    return null;
  }

  static extractJsonSubstring(input: string): string | null {
    // Find first { and last } and try to parse substring
    const firstBrace = input.indexOf('{');
    const lastBrace = input.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return input.substring(firstBrace, lastBrace + 1);
    }
    const firstBracket = input.indexOf('[');
    const lastBracket = input.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      return input.substring(firstBracket, lastBracket + 1);
    }
    return null;
  }

  static fixCommonIssues(input: string): string {
    let output = input;

    // Remove trailing commas before } or ]
    output = output.replace(/,\s*([}\]])/g, '$1');

    // Replace single quotes with double quotes, but be careful about escaping
    // This is a best-effort heuristic, not perfect
    if (output.includes("'")) {
      // Simple heuristic: replace ' with " only around keys/values that look like single-quoted
      output = output.replace(/'([^'\\]*?(?:\\'[^'\\]*?)*?)'/g, (match, inner) => {
        // Avoid replacing already escaped or double-quoted contexts
        const escaped = inner.replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
    }

    // Fix undefined, NaN, Infinity which are not valid JSON
    output = output.replace(/\bundefined\b/g, 'null');
    output = output.replace(/\bNaN\b/g, 'null');
    output = output.replace(/\bInfinity\b/g, 'null');

    return output;
  }

  static tryParseEmbeddedInScript(scriptContent: string): unknown[] {
    const results: unknown[] = [];
    if (!scriptContent) return results;

    // Strategy: Find all JSON-like objects via regex that are likely product data
    const patterns = [
      /window\.runParams\s*=\s*({[\s\S]*?});/,
      /window\._dida_config_\s*=\s*({[\s\S]*?});/,
      /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/,
      /__NEXT_DATA__[^>]*>([\s\S]*?)<\/script>/,
      /"data"\s*:\s*({[\s\S]*?"productId"[\s\S]*?})\s*[,}]/,
    ];

    for (const pattern of patterns) {
      const match = scriptContent.match(pattern);
      if (match?.[1]) {
        const parsed = this.parse(match[1]);
        if (parsed) results.push(parsed);
      }
    }

    // Fallback: try whole content
    const whole = this.parse(scriptContent);
    if (whole) results.push(whole);

    return results;
  }
}
