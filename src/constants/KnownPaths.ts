/**
 * KnownPaths.ts
 * Documented known paths for AliExpress data structures across versions.
 * Used as hints, NOT as hard dependencies. Engine will still work without them.
 * They are sorted by historical reliability.
 */

export const KNOWN_WINDOW_PATHS = [
  'runParams',
  '_dida_config_',
  '__NEXT_DATA__',
  '__INITIAL_STATE__',
  '__GLOBAL_DATA__',
  'AeStore',
  'window.runParams.data',
  'window._dida_config_.data',
] as const;

export const KNOWN_HYDRATION_KEYS = [
  'props.pageProps.initialData',
  'props.pageProps.data',
  'props.initialData',
  'data',
  'product',
  'productInfo',
  'item',
  'detail',
  'tradeProductDetail',
] as const;

export const KNOWN_PRODUCT_ROOTS = [
  'data.productInfoComponent',
  'data.skuComponent',
  'data.imageComponent',
  'data.priceComponent',
  'data.storeComponent',
  'product',
  'productInfo',
  'item',
  'detail',
  'props.pageProps',
  'result',
  'data.result',
  'data.data',
] as const;

export const KNOWN_SCRIPT_ID_PATTERNS = [
  /__AER__/,
  /runParams/,
  /_dida_config_/,
  /product-detail/,
  /initialData/,
  /NEXT_DATA/,
] as const;

export const META_TAG_KEYS = [
  'og:title',
  'og:description',
  'og:image',
  'og:url',
  'product:price:amount',
  'product:price:currency',
  'og:availability',
] as const;
