export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

export function isUrl(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    const url = new URL(value.startsWith('//') ? `https:${value}` : value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isRecordWithKeys(value: unknown, keys: string[]): value is Record<string, unknown> {
  if (!isObject(value)) return false;
  return keys.every(k => k in value);
}

export function hasProductIndicators(value: unknown): boolean {
  if (!isObject(value)) return false;
  const indicators = ['productId', 'subject', 'salePrice', 'skuProperty', 'imageModule', 'productTitle'];
  const present = indicators.filter(k => k in value).length;
  return present >= 2;
}
