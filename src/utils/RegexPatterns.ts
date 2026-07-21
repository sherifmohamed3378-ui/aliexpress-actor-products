export const RegexPatterns = {
  PRODUCT_ID: /(?:\/item\/|\/product\/|\/i\/|productId=)(\d{6,20})/,
  PRICE: /[\d,.]+/,
  CURRENCY_SYMBOL: /[$€£¥₹₽]/,
  IMAGE_URL: /https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp|avif)(?:[^"'\s]*)?/gi,
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  HTML_TAG: /<[^>]*>/g,
  JSON_IN_SCRIPT: /(?:window\.\w+|\w+)\s*=\s*({[\s\S]*?});/,
  SCRIPT_JSON: /<script[^>]*>([\s\S]*?)<\/script>/gi,
} as const;

export function buildKeyPattern(keys: readonly string[]): RegExp {
  const escaped = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^(?:${escaped.join('|')})$`, 'i');
}
