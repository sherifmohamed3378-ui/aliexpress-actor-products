import { UrlUtils } from '../utils/UrlUtils.js';

export class UrlNormalizer {
  static normalize(url: unknown, baseUrl?: string): string | null {
    if (url == null) return null;

    if (typeof url === 'string') {
      const trimmed = url.trim();
      if (!trimmed) return null;
      return UrlUtils.normalize(trimmed, baseUrl);
    }

    if (typeof url === 'object') {
      const obj = url as Record<string, unknown>;
      const candidates = ['url', 'link', 'href', 'src', 'path', 'imageUrl', 'thumbnail'];
      for (const c of candidates) {
        const v = obj[c];
        if (typeof v === 'string') {
          const normalized = UrlUtils.normalize(v, baseUrl);
          if (normalized) return normalized;
        }
      }
    }

    return null;
  }

  static normalizeArray(urls: unknown[], baseUrl?: string): string[] {
    const result: string[] = [];
    const seen = new Set<string>();

    for (const u of urls) {
      const normalized = this.normalize(u, baseUrl);
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        result.push(normalized);
      }
    }

    return result;
  }
}
