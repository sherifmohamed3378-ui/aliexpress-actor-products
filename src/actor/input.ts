/**
 * Actor input parsing and validation.
 */

import type { ProxyConfigurationOptions } from 'apify';

export interface StartUrl {
  readonly url: string;
}

export interface ActorInput {
  readonly startUrls: readonly StartUrl[];
  readonly country: string;
  readonly currency: string;
  readonly locale: string;
  readonly maxItems: number;
  readonly confidenceThreshold: number;
  readonly includeRawData: boolean;
  readonly proxyConfiguration?: ProxyConfigurationOptions;
}

const DEFAULT_MAX_ITEMS = 100;
const DEFAULT_CONFIDENCE_THRESHOLD = 0.3;
const DEFAULT_COUNTRY = 'US';
const DEFAULT_CURRENCY = 'USD';
const DEFAULT_LOCALE = 'en_US';

const DEFAULT_START_URLS: readonly StartUrl[] = [
  { url: 'https://www.aliexpress.com/item/1005006000000000.html' },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseStartUrls(raw: unknown): readonly StartUrl[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_START_URLS;
  }

  const urls: StartUrl[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && item.trim().length > 0) {
      urls.push({ url: item.trim() });
      continue;
    }
    if (isRecord(item) && typeof item.url === 'string' && item.url.trim().length > 0) {
      urls.push({ url: item.url.trim() });
    }
  }

  return urls.length > 0 ? urls : DEFAULT_START_URLS;
}

function parseCountry(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim().toUpperCase();
  }
  return DEFAULT_COUNTRY;
}

function parseCurrency(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim().toUpperCase();
  }
  return DEFAULT_CURRENCY;
}

function parseLocale(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim();
  }
  return DEFAULT_LOCALE;
}

function parseMaxItems(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return DEFAULT_MAX_ITEMS;
  }
  return Math.min(10000, Math.max(1, Math.floor(raw)));
}

function parseConfidenceThreshold(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return DEFAULT_CONFIDENCE_THRESHOLD;
  }
  return Math.min(1, Math.max(0, raw));
}

function parseIncludeRawData(raw: unknown): boolean {
  return raw === true;
}

function parseProxyConfiguration(raw: unknown): ProxyConfigurationOptions | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }
  return raw as ProxyConfigurationOptions;
}

/**
 * Parses and validates Actor input from Apify platform or local runs.
 */
export function parseActorInput(raw: unknown): ActorInput {
  const input = isRecord(raw) ? raw : {};

  const parsed: ActorInput = {
    startUrls: parseStartUrls(input.startUrls),
    country: parseCountry(input.country),
    currency: parseCurrency(input.currency),
    locale: parseLocale(input.locale),
    maxItems: parseMaxItems(input.maxItems),
    confidenceThreshold: parseConfidenceThreshold(input.confidenceThreshold),
    includeRawData: parseIncludeRawData(input.includeRawData),
  };

  const proxyConfiguration = parseProxyConfiguration(input.proxyConfiguration);
  if (proxyConfiguration) {
    return { ...parsed, proxyConfiguration };
  }

  return parsed;
}