import { describe, it, expect } from 'vitest';

import { formatActorErrorOutput, formatActorOutput } from '../../../src/actor/output.js';
import { createField } from '../../../src/types/common/Field.js';
import { SourceType } from '../../../src/constants/ConfidenceWeights.js';    const record = formatActorOutput({
      inputUrl: 'https://www.aliexpress.com/item/123.html',
      extractedUrl: 'https://www.aliexpress.com/item/123.html',
      extractionResult: {
        product: {
          productId: createField('123', { sourceType: SourceType.WINDOW_OBJECT, sourceKey: 'productId', path: 'data.productId', collectorId: 'WindowObjectCollector', depth: 1, timestamp: Date.now() }, 0.95, 'productId', { extractionTimeMs: 1, validationPassed: true, normalizationApplied: [], alternativesConsidered: 1, traversalDepth: 1 }),
          title: createField('Test Product', {
 sourceType: SourceType.WINDOW_OBJECT,
 sourceKey: 'productId',
 path: 'data.productId',
 collectorId: 'WindowObjectCollector',
 depth: 1,
 timestamp: Date.now()
}, 0.9, 'subject', { extractionTimeMs: 1, validationPassed: true, normalizationApplied: [], alternativesConsidered: 1, traversalDepth: 1 }),
          subtitle: null,
          url: null,
          canonicalUrl: null,
          category: null,
          categoryIds: null,
          breadcrumbs: null,
          brand: null,
          model: null,
          price: null,
          originalPrice: null,
          salePrice: null,
          priceRange: null,
          currency: null,
          currencySymbol: null,
          discount: null,
          coupons: null,
          promotions: null,
          flashDeals: null,
          choiceBadge: null,
          plusBadge: null,
          topBrandBadge: null,
          orders: null,
          sales: null,
          wishlistCount: null,
          favoriteCount: null,
          stock: null,
          inventory: null,
          availability: null,
          warehouse: null,
          shipFrom: null,
          shipsTo: null,
          estimatedDelivery: null,
          deliveryRange: null,
          shippingCompanies: null,
          shippingCost: null,
          shippingCurrency: null,
          shippingMethods: null,
          seller: null,
          store: null,
          storeId: null,
          storeUrl: null,
          storeLevel: null,
          storeAge: null,
          followers: null,
          positiveFeedback: null,
          responseRate: null,
          productsSold: null,
          reviewCount: null,
          averageRating: null,
          ratingBreakdown: null,
          reviewPhotos: null,
          reviewVideos: null,
          reviewTags: null,
          reviewLanguages: null,
          buyerCountries: null,
          images: null,
          mainImage: null,
          gallery: null,
          variantImages: null,
          skuImages: null,
          videos: null,
          videoThumbnail: null,
          videoDuration: null,
          description: null,
          htmlDescription: null,
          specifications: null,
          attributes: null,
          packageContents: null,
          dimensions: null,
          weight: null,
          skuProperties: null,
          skuInventory: null,
          skuPrices: null,
          skuPromotions: null,
          skuMapping: null,
          skuIds: null,
          _extractionMeta: {
            totalSources: 2,
            totalFields: 2,
            averageConfidence: 0.925,
            extractionTimeMs: 50,
          },
        },
        discovery: { sources: [], url: 'https://www.aliexpress.com/item/123.html', timestamp: Date.now() },
        errors: [],
        warnings: ['Missing images'],
        performance: {
          totalTimeMs: 50,
          collectionTimeMs: 10,
          indexingTimeMs: 10,
          extractionTimeMs: 20,
          mergingTimeMs: 5,
          validationTimeMs: 5,
          sources: 2,
          fields: 2,
          averageConfidence: 0.925,
        },
      },
    });

    expect(record.success).toBe(true);
    expect(record.productId).toBe('123');
    expect(record.title).toBe('Test Product');
    expect(record._extraction?.fieldConfidences).toEqual({
      productId: 0.95,
      title: 0.9,
    });
    expect(record._extraction?.warnings).toEqual(['Missing images']);
    expect(record._extraction?.performance.totalTimeMs).toBe(50);
  ;


describe('formatActorErrorOutput', () => {
  it('formats failed extraction records', () => {
    const record = formatActorErrorOutput({
      inputUrl: 'https://www.aliexpress.com/item/404.html',
      error: 'Navigation timeout',
    });

    expect(record.success).toBe(false);
    expect(record.error).toBe('Navigation timeout');
    expect(record.inputUrl).toBe('https://www.aliexpress.com/item/404.html');
  });
});
