/**
 * AliExpress Product Extraction Engine
 * Public API entry point - usable as npm package and Apify actor.
 *
 * @module aliexpress-product-extraction-engine
 * @example
 * import { ProductExtractionEngine } from 'aliexpress-product-extraction-engine';
 * const engine = new ProductExtractionEngine();
 * const result = await engine.extract({ url: 'https://www.aliexpress.com/item/123.html', html });
 */

// ============================================================================
// Core Engine
// ============================================================================
export { ProductExtractionEngine, getDefaultEngine } from './core/ProductExtractionEngine.js';
export type { ExtractionInput, ExtractionResult } from './core/ProductExtractionEngine.js';

// ============================================================================
// Config
// ============================================================================
export {
  EngineConfigFactory,
  DEFAULT_ENGINE_CONFIG,
  validateEngineConfig,
} from './core/config/EngineConfig.js';
export type { EngineConfig, LogLevel, PerformanceMode } from './core/config/EngineConfig.js';

// ============================================================================
// Pipeline
// ============================================================================
export { Pipeline } from './core/pipeline/Pipeline.js';
export { PipelineStage, createStage } from './core/pipeline/PipelineStage.js';
export { PipelineRunner, DEFAULT_RUNNER_OPTIONS } from './core/pipeline/PipelineRunner.js';
export type { PipelineContext, StageResult } from './core/pipeline/PipelineStage.js';
export type { PipelineResult } from './core/pipeline/Pipeline.js';
export type { RunnerOptions } from './core/pipeline/PipelineRunner.js';

// Pipeline stages
export { CollectionStage } from './core/pipeline/stages/CollectionStage.js';
export { IndexingStage } from './core/pipeline/stages/IndexingStage.js';
export { ExtractionStage } from './core/pipeline/stages/ExtractionStage.js';
export { MergingStage } from './core/pipeline/stages/MergingStage.js';
export { NormalizationStage } from './core/pipeline/stages/NormalizationStage.js';
export { ValidationStage } from './core/pipeline/stages/ValidationStage.js';

// ============================================================================
// Merger & Validation
// ============================================================================
export { ResultMerger, DEFAULT_MERGE_OPTIONS } from './core/merger/ResultMerger.js';
export type { MergeOptions } from './core/merger/ResultMerger.js';
export { ProductValidator, FieldValidator } from './core/validation/ProductValidator.js';
export type { ValidationResult } from './core/validation/ProductValidator.js';

// ============================================================================
// Discovery Layer
// ============================================================================
export { CompositeCollector } from './core/discovery/collectors/CompositeCollector.js';
export { WindowObjectCollector } from './core/discovery/collectors/WindowObjectCollector.js';
export { EmbeddedJsonCollector } from './core/discovery/collectors/EmbeddedJsonCollector.js';
export { HydrationStateCollector } from './core/discovery/collectors/HydrationStateCollector.js';
export { MetaTagCollector } from './core/discovery/collectors/MetaTagCollector.js';
export { LdJsonCollector } from './core/discovery/collectors/LdJsonCollector.js';
export { NetworkResponseCollector } from './core/discovery/collectors/NetworkResponseCollector.js';
export { DomFallbackCollector } from './core/discovery/collectors/DomFallbackCollector.js';
export type { ICollector, ICollectionContext } from './core/discovery/collectors/ICollector.js';

export { ObjectTraverser } from './core/discovery/traversal/ObjectTraverser.js';
export { CycleDetector, PathCycleDetector } from './core/discovery/traversal/CycleDetector.js';
export { PathMatcher } from './core/discovery/traversal/PathMatcher.js';
export { ValueExtractor } from './core/discovery/traversal/ValueExtractor.js';
export type { TraversalOptions, SearchOptions } from './core/discovery/traversal/TraversalOptions.js';
export { DEFAULT_TRAVERSAL_OPTIONS, DEFAULT_SEARCH_OPTIONS } from './core/discovery/traversal/TraversalOptions.js';

export { DeepObjectIndexer } from './core/discovery/indexing/DeepObjectIndexer.js';
export { KeyFrequencyIndex } from './core/discovery/indexing/KeyFrequencyIndex.js';
export type { KeyFrequency } from './core/discovery/indexing/KeyFrequencyIndex.js';
export { PathIndex } from './core/discovery/indexing/PathIndex.js';

// ============================================================================
// Extraction Base
// ============================================================================
export { BaseExtractor } from './core/extraction/BaseExtractor.js';
export { ExtractorRegistry } from './core/extraction/ExtractorRegistry.js';
export { ExtractionContext } from './core/extraction/ExtractionContext.js';
export type { IExtractor } from './core/extraction/IExtractor.js';
export { ConfidenceCalculator } from './core/extraction/Confidence/ConfidenceCalculator.js';
export type { ConfidenceInput } from './core/extraction/Confidence/ConfidenceCalculator.js';
export { SourceProvenanceFactory } from './core/extraction/Confidence/SourceProvenance.js';

// ============================================================================
// Extractors - Product
// ============================================================================
export { TitleExtractor } from './extractors/product/TitleExtractor.js';
export { SubtitleExtractor } from './extractors/product/SubtitleExtractor.js';
export { ProductIdExtractor } from './extractors/product/ProductIdExtractor.js';
export { UrlExtractor, CanonicalUrlExtractor } from './extractors/product/UrlExtractor.js';
export { CategoryExtractor, CategoryIdsExtractor } from './extractors/product/CategoryExtractor.js';
export { BreadcrumbExtractor } from './extractors/product/BreadcrumbExtractor.js';
export { BrandExtractor, ModelExtractor } from './extractors/product/BrandExtractor.js';
export { DescriptionExtractor, HtmlDescriptionExtractor } from './extractors/product/DescriptionExtractor.js';

// Price
export { PriceExtractor } from './extractors/price/PriceExtractor.js';
export { OriginalPriceExtractor, SalePriceExtractor, PriceRangeExtractor } from './extractors/price/OriginalPriceExtractor.js';
export { CurrencyExtractor, CurrencySymbolExtractor, DiscountExtractor } from './extractors/price/CurrencyExtractor.js';
export { CouponExtractor, PromotionExtractor, FlashDealsExtractor } from './extractors/price/CouponExtractor.js';

// Badges
export { ChoiceBadgeExtractor, PlusBadgeExtractor, TopBrandBadgeExtractor } from './extractors/badges/BadgeExtractor.js';

// Inventory
export { StockExtractor, InventoryExtractor, AvailabilityExtractor, WarehouseExtractor } from './extractors/inventory/StockExtractor.js';

// Orders
export { OrdersExtractor, SalesExtractor, WishlistExtractor, FavoriteCountExtractor } from './extractors/orders/OrdersExtractor.js';

// Shipping
export {
  ShipFromExtractor,
  ShipsToExtractor,
  EstimatedDeliveryExtractor,
  DeliveryRangeExtractor,
  ShippingCompaniesExtractor,
  ShippingCostExtractor,
  ShippingCurrencyExtractor,
  ShippingMethodsExtractor,
} from './extractors/shipping/ShippingExtractor.js';

// Seller
export {
  SellerExtractor,
  StoreExtractor,
  StoreIdExtractor,
  StoreUrlExtractor,
  StoreLevelExtractor,
  FollowersExtractor,
  PositiveFeedbackExtractor,
} from './extractors/seller/SellerExtractor.js';

// Rating
export {
  ReviewCountExtractor,
  AverageRatingExtractor,
  RatingBreakdownExtractor,
  ReviewTagsExtractor,
} from './extractors/rating/RatingExtractor.js';

// Media
export {
  ImagesExtractor,
  MainImageExtractor,
  GalleryExtractor,
  VariantImagesExtractor,
  SkuImagesExtractor,
  VideosExtractor,
  VideoThumbnailExtractor,
  VideoDurationExtractor,
} from './extractors/media/MediaExtractor.js';

// Specifications
export {
  SpecificationsExtractor,
  AttributesExtractor,
  PackageContentsExtractor,
  DimensionsExtractor,
  WeightExtractor,
} from './extractors/specifications/SpecificationExtractor.js';

// SKU
export {
  SkuPropertiesExtractor,
  SkuMappingExtractor,
  SkuInventoryExtractor,
  SkuPricesExtractor,
  SkuIdsExtractor,
  SkuPromotionsExtractor,
} from './extractors/sku/SkuExtractor.js';

// ============================================================================
// Normalizers
// ============================================================================
export { TextNormalizer } from './normalizers/TextNormalizer.js';
export { PriceNormalizer } from './normalizers/PriceNormalizer.js';
export type { NormalizedPrice } from './normalizers/PriceNormalizer.js';
export { UrlNormalizer } from './normalizers/UrlNormalizer.js';
export { ImageNormalizer } from './normalizers/ImageNormalizer.js';
export { CategoryNormalizer } from './normalizers/CategoryNormalizer.js';
export { RatingNormalizer } from './normalizers/RatingNormalizer.js';
export { SkuNormalizer } from './normalizers/SkuNormalizer.js';
export { HtmlNormalizer, StockNormalizer, ShippingNormalizer } from './normalizers/HtmlNormalizer.js';

// ============================================================================
// Types
// ============================================================================
export type { Field, AlternativeValue, OptionalField } from './types/common/Field.js';
export { createField, isField } from './types/common/Field.js';
export type { SourceMetadata, ExtractionMetadata, Provenance } from './types/common/Source.js';
export type { ConfidenceDetail } from './types/common/Confidence.js';
export { clampConfidence, calculateFinalConfidence } from './types/common/Confidence.js';
export type { ExtractorId } from './types/common/ExtractionMetadata.js';

export type { RawDataSource, DiscoveryContext, PageMeta, FoundEntry, IndexedSource } from './types/discovery/DiscoveryTypes.js';
export type {
  AliExpressProduct,
  ProductFieldKey,
  PriceValue,
  PriceRangeValue,
  CurrencyValue,
  ImageValue,
  VideoValue,
  CategoryValue,
  BreadcrumbValue,
  BrandValue,
  ShippingMethodValue,
  SellerValue,
  RatingBreakdownValue,
  SkuPropertyValue,
  SkuPropertyOptionValue,
  SkuMappingValue,
  SpecificationValue,
  BadgeValue,
  CouponValue,
  PromotionValue,
} from './types/product/Product.js';

export type { EngineConfig as LegacyEngineConfig, EngineResult, EngineError, EnginePerformance, ExtractionRequest } from './types/engine/EngineTypes.js';
export { DEFAULT_ENGINE_CONFIG as LEGACY_DEFAULT_CONFIG } from './types/engine/EngineTypes.js';

// ============================================================================
// Constants
// ============================================================================
export {
  SIGNAL_DICTIONARY,
  PRODUCT_SIGNALS,
  PRICE_SIGNALS,
  IMAGE_SIGNALS,
  SKU_SIGNALS,
  SELLER_SIGNALS,
  SHIPPING_SIGNALS,
  RATING_SIGNALS,
  CATEGORY_SIGNALS,
  PROMOTION_SIGNALS,
  ORDERS_SIGNALS,
  PRODUCT_CONTAINER_INDICATORS,
} from './constants/SignalKeys.js';

export { SourceType, SOURCE_CONFIDENCE_WEIGHTS, CONFIDENCE_ADJUSTMENTS, DEFAULT_CONFIDENCE_THRESHOLDS } from './constants/ConfidenceWeights.js';
export type { ConfidenceWeightConfig } from './constants/ConfidenceWeights.js';
export { KNOWN_WINDOW_PATHS, KNOWN_HYDRATION_KEYS, KNOWN_PRODUCT_ROOTS, KNOWN_SCRIPT_ID_PATTERNS, META_TAG_KEYS } from './constants/KnownPaths.js';
export { ErrorCode } from './constants/ErrorCodes.js';

// ============================================================================
// Utils
// ============================================================================
export { SafeJsonParser } from './utils/SafeJsonParser.js';
export { StringUtils } from './utils/StringUtils.js';
export { UrlUtils } from './utils/UrlUtils.js';
export { Cache, WeakCache } from './utils/Cache.js';
export { memoize, memoizeWeak } from './utils/Memoizer.js';
export { RegexPatterns, buildKeyPattern } from './utils/RegexPatterns.js';
export { DeepMerger } from './utils/DeepMerger.js';
export { ConsoleLogger, NoOpLogger, logger } from './utils/Logger.js';
export type { ILogger, LogLevel as LoggerLogLevel } from './utils/Logger.js';
export {
  isObject,
  isArray,
  isString,
  isNumber,
  isNonEmptyString,
  isPositiveNumber,
  isUrl,
  isRecordWithKeys,
  hasProductIndicators,
} from './utils/TypeGuards.js';

// ============================================================================
// Version
// ============================================================================
export const VERSION = '1.0.0';
