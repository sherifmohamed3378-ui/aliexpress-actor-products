import { StringUtils } from '../utils/StringUtils.js';

export class TextNormalizer {
  static normalize(text: unknown): string | null {
    if (text == null) return null;
    if (typeof text === 'string') {
      const cleaned = StringUtils.clean(text);
      return cleaned.length > 0 ? cleaned : null;
    }
    if (typeof text === 'number') {
      return String(text);
    }
    if (typeof text === 'object') {
      const obj = text as Record<string, unknown>;
      const candidates = ['text', 'value', 'name', 'title', 'subject', 'displayName', 'label'];
      for (const c of candidates) {
        const v = obj[c];
        if (typeof v === 'string' && v.trim().length > 0) {
          return StringUtils.clean(v);
        }
      }
    }
    return null;
  }

  static normalizeArray(values: unknown[]): string[] {
    const result: string[] = [];
    for (const v of values) {
      const normalized = this.normalize(v);
      if (normalized) result.push(normalized);
    }
    return result;
  }

  static sanitizeForHtml(text: string): string {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
  }
}
