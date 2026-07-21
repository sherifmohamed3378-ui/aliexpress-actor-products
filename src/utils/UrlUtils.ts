export class UrlUtils {
  static normalize(url: string, base?: string): string | null {
    if (!url) return null;
    const trimmed = url.trim();

    try {
      if (trimmed.startsWith('//')) {
        return `https:${trimmed}`;
      }
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      if (base) {
        return new URL(trimmed, base).toString();
      }
      // Relative image paths on AliExpress often start with / or without protocol
      if (trimmed.startsWith('/')) {
        return `https://ae01.alicdn.com${trimmed}`;
      }
      return `https://${trimmed.replace(/^\/+/, '')}`;
    } catch {
      return null;
    }
  }

  static isAliExpressImage(url: string): boolean {
    return /alicdn\.com|alibaba\.com|aliexpress\.com/.test(url);
  }

  static makeCanonical(productId: string): string {
    return `https://www.aliexpress.com/item/${productId}.html`;
  }

  static extractDomain(url: string): string | null {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  static ensureHttps(url: string): string {
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('http://')) return url.replace('http://', 'https://');
    return url;
  }
}
