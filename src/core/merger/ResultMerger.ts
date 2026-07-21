/**
 * ResultMerger.ts
 * Merges extracted fields into final product with confidence resolution, provenance preservation.
 *
 * Responsibilities:
 * - Highest confidence wins
 * - Preserve provenance
 * - Preserve alternatives when useful
 * - Handle threshold filtering
 *
 * @module core/merger
 */

import { logger } from '../../utils/Logger.js';

import type { Field } from '../../types/common/Field.js';
import type { AliExpressProduct } from '../../types/product/Product.js';

export interface MergeOptions {
  readonly preserveAlternatives: boolean;
  readonly maxAlternatives: number;
  readonly confidenceThreshold: number;
}

export const DEFAULT_MERGE_OPTIONS: MergeOptions = {
  preserveAlternatives: true,
  maxAlternatives: 3,
  confidenceThreshold: 0.3,
} as const;

export class ResultMerger {
  private readonly log = logger.child('ResultMerger');

  merge(fields: Map<string, Field<unknown> | null>, options: MergeOptions = DEFAULT_MERGE_OPTIONS): AliExpressProduct {
    const start = Date.now();

    const getField = <T>(key: string): Field<T> | null => {
      const field = fields.get(key);
      if (!field) return null;
      // Confidence threshold
      if (field.confidence < options.confidenceThreshold) {
        this.log.debug(`Field ${key} filtered by threshold ${field.confidence} < ${options.confidenceThreshold}`);
        return null;
      }
      // Trim alternatives if needed
      if (!options.preserveAlternatives && field.alternatives) {
        const { alternatives: _alt, ...rest } = field;
        return rest as Field<T>;
      }
      if (options.preserveAlternatives && field.alternatives && field.alternatives.length > options.maxAlternatives) {
        return {
          ...field,
          alternatives: field.alternatives.slice(0, options.maxAlternatives),
        } as Field<T>;
      }
      return field as Field<T>;
    };

    // Build product - all fields optional null if missing
    const product: AliExpressProduct = {
      // Identifiers
      productId: getField<string>('productId'),
      title: getField<string>('title'),
      subtitle: getField<string>('subtitle'),
      url: getField<string>('url'),
      canonicalUrl: getField<string>('canonicalUrl'),

      // Categorization
      category: getField('category'),
      categoryIds: getField<readonly string[]>('categoryIds'),
      breadcrumbs: getField('breadcrumbs'),
      brand: getField('brand'),
      model: getField<string>('model'),

      // Pricing
      price: getField('price'),
      originalPrice: getField('originalPrice'),
      salePrice: getField('salePrice'),
      priceRange: getField('priceRange'),
      currency: getField('currency'),
      currencySymbol: getField<string>('currencySymbol'),
      discount: getField<number>('discount'),

      // Promotions
      coupons: getField('coupons'),
      promotions: getField('promotions'),
      flashDeals: getField('flashDeals'),
      choiceBadge: getField('choiceBadge'),
      plusBadge: getField('plusBadge'),
      topBrandBadge: getField('topBrandBadge'),

      // Sales / Social
      orders: getField<number>('orders'),
      sales: getField<number>('sales'),
      wishlistCount: getField<number>('wishlistCount'),
      favoriteCount: getField<number>('favoriteCount'),

      // Inventory
      stock: getField<number>('stock'),
      inventory: getField<number>('inventory'),
      availability: getField<boolean>('availability'),
      warehouse: getField<string>('warehouse'),

      // Shipping
      shipFrom: getField<string>('shipFrom'),
      shipsTo: getField<readonly string[]>('shipsTo'),
      estimatedDelivery: getField<string>('estimatedDelivery'),
      deliveryRange: getField<{ min: string; max: string }>('deliveryRange'),
      shippingCompanies: getField<readonly string[]>('shippingCompanies'),
      shippingCost: getField('shippingCost'),
      shippingCurrency: getField<string>('shippingCurrency'),
      shippingMethods: getField('shippingMethods'),

      // Seller
      seller: getField('seller'),
      store: getField('store'),
      storeId: getField<string>('storeId'),
      storeUrl: getField<string>('storeUrl'),
      storeLevel: getField<string>('storeLevel'),
      storeAge: getField<string>('storeAge'),
      followers: getField<number>('followers'),
      positiveFeedback: getField<number>('positiveFeedback'),
      responseRate: getField<number>('responseRate'),
      productsSold: getField<number>('productsSold'),

      // Reviews
      reviewCount: getField<number>('reviewCount'),
      averageRating: getField<number>('averageRating'),
      ratingBreakdown: getField('ratingBreakdown'),
      reviewPhotos: getField<readonly string[]>('reviewPhotos'),
      reviewVideos: getField<readonly string[]>('reviewVideos'),
      reviewTags: getField<readonly string[]>('reviewTags'),
      reviewLanguages: getField<readonly string[]>('reviewLanguages'),
      buyerCountries: getField<readonly string[]>('buyerCountries'),

      // Media
      images: getField('images'),
      mainImage: getField('mainImage'),
      gallery: getField('gallery'),
      variantImages: getField('variantImages'),
      skuImages: getField('skuImages'),
      videos: getField('videos'),
      videoThumbnail: getField<string>('videoThumbnail'),
      videoDuration: getField<number>('videoDuration'),

      // Description
      description: getField<string>('description'),
      htmlDescription: getField<string>('htmlDescription'),
      specifications: getField('specifications'),
      attributes: getField('attributes'),
      packageContents: getField<readonly string[]>('packageContents'),
      dimensions: getField<string>('dimensions'),
      weight: getField<string>('weight'),

      // SKU
      skuProperties: getField('skuProperties'),
      skuInventory: getField<Record<string, number>>('skuInventory'),
      skuPrices: getField('skuPrices'),
      skuPromotions: getField<Record<string, unknown>>('skuPromotions'),
      skuMapping: getField('skuMapping'),
      skuIds: getField<readonly string[]>('skuIds'),
    };

    const totalFields = Object.values(product).filter(v => v !== null).length;
    const avgConfidence = this.calculateAverageConfidence(product);

    const meta = {
      totalSources: 0, // will be filled by engine
      totalFields,
      averageConfidence: avgConfidence,
      extractionTimeMs: Date.now() - start,
    };

    this.log.info(`Merged product`, { totalFields, avgConfidence, durationMs: Date.now() - start });

    return {
      ...product,
      _extractionMeta: meta,
    };
  }

  private calculateAverageConfidence(product: AliExpressProduct): number {
    const fields = Object.values(product).filter(v => v !== null && typeof v === 'object' && 'confidence' in (v as object)) as { confidence: number }[];
    if (fields.length === 0) return 0;
    const sum = fields.reduce((acc, f) => acc + f.confidence, 0);
    return sum / fields.length;
  }
}
