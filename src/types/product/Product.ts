import type { Field, OptionalField } from '../common/Field.js';

export interface PriceValue {
  readonly amount: number;
  readonly raw?: string;
  readonly formatted?: string;
}

export interface PriceRangeValue {
  readonly min: number;
  readonly max: number;
  readonly rawMin?: string;
  readonly rawMax?: string;
}

export interface CurrencyValue {
  readonly code: string;
  readonly symbol?: string;
}

export interface ImageValue {
  readonly url: string;
  readonly width?: number;
  readonly height?: number;
  readonly type?: 'main' | 'gallery' | 'variant' | 'sku';
}

export interface VideoValue {
  readonly url: string;
  readonly thumbnail?: string;
  readonly duration?: number;
}

export interface CategoryValue {
  readonly name: string;
  readonly id?: string;
  readonly url?: string;
}

export interface BreadcrumbValue {
  readonly name: string;
  readonly id?: string;
  readonly url?: string;
  readonly level: number;
}

export interface BrandValue {
  readonly name: string;
  readonly id?: string;
}

export interface ShippingMethodValue {
  readonly company: string;
  readonly cost: number;
  readonly currency: string;
  readonly estimatedDelivery?: string;
  readonly deliveryRange?: { min: number; max: number; unit: string };
}

export interface SellerValue {
  readonly name: string;
  readonly id: string;
  readonly url?: string;
  readonly level?: string;
  readonly age?: string;
  readonly followers?: number;
  readonly positiveFeedback?: number;
  readonly responseRate?: number;
  readonly productsSold?: number;
}

export interface RatingBreakdownValue {
  readonly stars: number;
  readonly count: number;
  readonly percentage: number;
}

export interface SkuPropertyValue {
  readonly id: string;
  readonly name: string;
  readonly values: readonly SkuPropertyOptionValue[];
}

export interface SkuPropertyOptionValue {
  readonly id: string;
  readonly name: string;
  readonly image?: string;
  readonly displayName?: string;
}

export interface SkuMappingValue {
  readonly skuId: string;
  readonly propertyValueIds: string;
  readonly price: number;
  readonly originalPrice?: number;
  readonly stock: number;
  readonly image?: string;
  readonly availability?: boolean;
}

export interface SpecificationValue {
  readonly name: string;
  readonly value: string;
}

export interface BadgeValue {
  readonly type: 'choice' | 'plus' | 'topBrand' | 'other';
  readonly present: boolean;
  readonly text?: string;
}

export interface CouponValue {
  readonly amount: number;
  readonly currency: string;
  readonly condition: string;
  readonly discount?: string;
}

export interface PromotionValue {
  readonly type: string;
  readonly description: string;
  readonly discount?: string;
}

export interface AliExpressProduct {
  // Identifiers
  readonly productId: OptionalField<string>;
  readonly title: OptionalField<string>;
  readonly subtitle: OptionalField<string>;
  readonly url: OptionalField<string>;
  readonly canonicalUrl: OptionalField<string>;

  // Categorization
  readonly category: OptionalField<CategoryValue>;
  readonly categoryIds: OptionalField<readonly string[]>;
  readonly breadcrumbs: OptionalField<readonly BreadcrumbValue[]>;
  readonly brand: OptionalField<BrandValue>;
  readonly model: OptionalField<string>;

  // Pricing
  readonly price: OptionalField<PriceValue>;
  readonly originalPrice: OptionalField<PriceValue>;
  readonly salePrice: OptionalField<PriceValue>;
  readonly priceRange: OptionalField<PriceRangeValue>;
  readonly currency: OptionalField<CurrencyValue>;
  readonly currencySymbol: OptionalField<string>;
  readonly discount: OptionalField<number>;

  // Promotions
  readonly coupons: OptionalField<readonly CouponValue[]>;
  readonly promotions: OptionalField<readonly PromotionValue[]>;
  readonly flashDeals: OptionalField<readonly PromotionValue[]>;
  readonly choiceBadge: OptionalField<BadgeValue>;
  readonly plusBadge: OptionalField<BadgeValue>;
  readonly topBrandBadge: OptionalField<BadgeValue>;

  // Sales / Social
  readonly orders: OptionalField<number>;
  readonly sales: OptionalField<number>;
  readonly wishlistCount: OptionalField<number>;
  readonly favoriteCount: OptionalField<number>;

  // Inventory
  readonly stock: OptionalField<number>;
  readonly inventory: OptionalField<number>;
  readonly availability: OptionalField<boolean>;
  readonly warehouse: OptionalField<string>;

  // Shipping
  readonly shipFrom: OptionalField<string>;
  readonly shipsTo: OptionalField<readonly string[]>;
  readonly estimatedDelivery: OptionalField<string>;
  readonly deliveryRange: OptionalField<{ min: string; max: string }>;
  readonly shippingCompanies: OptionalField<readonly string[]>;
  readonly shippingCost: OptionalField<PriceValue>;
  readonly shippingCurrency: OptionalField<string>;
  readonly shippingMethods: OptionalField<readonly ShippingMethodValue[]>;

  // Seller
  readonly seller: OptionalField<SellerValue>;
  readonly store: OptionalField<SellerValue>;
  readonly storeId: OptionalField<string>;
  readonly storeUrl: OptionalField<string>;
  readonly storeLevel: OptionalField<string>;
  readonly storeAge: OptionalField<string>;
  readonly followers: OptionalField<number>;
  readonly positiveFeedback: OptionalField<number>;
  readonly responseRate: OptionalField<number>;
  readonly productsSold: OptionalField<number>;

  // Reviews
  readonly reviewCount: OptionalField<number>;
  readonly averageRating: OptionalField<number>;
  readonly ratingBreakdown: OptionalField<readonly RatingBreakdownValue[]>;
  readonly reviewPhotos: OptionalField<readonly string[]>;
  readonly reviewVideos: OptionalField<readonly string[]>;
  readonly reviewTags: OptionalField<readonly string[]>;
  readonly reviewLanguages: OptionalField<readonly string[]>;
  readonly buyerCountries: OptionalField<readonly string[]>;

  // Media
  readonly images: OptionalField<readonly ImageValue[]>;
  readonly mainImage: OptionalField<ImageValue>;
  readonly gallery: OptionalField<readonly ImageValue[]>;
  readonly variantImages: OptionalField<readonly ImageValue[]>;
  readonly skuImages: OptionalField<readonly ImageValue[]>;
  readonly videos: OptionalField<readonly VideoValue[]>;
  readonly videoThumbnail: OptionalField<string>;
  readonly videoDuration: OptionalField<number>;

  // Description
  readonly description: OptionalField<string>;
  readonly htmlDescription: OptionalField<string>;
  readonly specifications: OptionalField<readonly SpecificationValue[]>;
  readonly attributes: OptionalField<readonly SpecificationValue[]>;
  readonly packageContents: OptionalField<readonly string[]>;
  readonly dimensions: OptionalField<string>;
  readonly weight: OptionalField<string>;

  // SKU
  readonly skuProperties: OptionalField<readonly SkuPropertyValue[]>;
  readonly skuInventory: OptionalField<Record<string, number>>;
  readonly skuPrices: OptionalField<Record<string, PriceValue>>;
  readonly skuPromotions: OptionalField<Record<string, unknown>>;
  readonly skuMapping: OptionalField<readonly SkuMappingValue[]>;
  readonly skuIds: OptionalField<readonly string[]>;

  // Raw aggregated debug (optional)
  readonly _raw?: unknown;
  readonly _extractionMeta?: {
    readonly totalSources: number;
    readonly totalFields: number;
    readonly averageConfidence: number;
    readonly extractionTimeMs: number;
  };
}

export type ProductFieldKey = keyof Omit<AliExpressProduct, '_raw' | '_extractionMeta'>;
