export class StringUtils {
  static clean(text: string): string {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ')
      .replace(/\u00A0/g, ' ')
      .trim();
  }

  static normalizeWhitespace(text: string): string {
    return text.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  static extractFirstUrl(text: string): string | null {
    const match = text.match(/https?:\/\/[^\s"'<>]+|(?:\/\/)[^\s"'<>]+\.[^\s"'<>]+/);
    return match?.[0] ?? null;
  }

  static extractProductIdFromUrl(url: string): string | null {
    try {
      // Patterns: /item/123456.html , /1005006000000000.html , productId=123
      const patterns = [
        /\/item\/(\d+)\.html/,
        /\/(\d{8,20})\.html/,
        /[?&]productId=(\d+)/,
        /[?&]itemId=(\d+)/,
        /aliexpress\.com\/.*\/(\d{12,})\.html/,
      ];
      for (const p of patterns) {
        const m = url.match(p);
        if (m?.[1]) return m[1];
      }
      const lastSegment = url.split('/').pop();
      if (lastSegment) {
        const numMatch = lastSegment.match(/(\d{10,})/);
        if (numMatch?.[1]) return numMatch[1];
      }
      return null;
    } catch {
      return null;
    }
  }

  static truncate(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen)}...`;
  }

  static isHtml(text: string): boolean {
    return /<\/?[a-z][\s\S]*>/i.test(text);
  }

  static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
