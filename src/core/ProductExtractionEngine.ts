/**
 * ProductExtractionEngine.ts
 * Enterprise-grade orchestration layer for AliExpress product extraction.
 *
 * Flow:
 * HTML / windowObjects / networkResponses
 *   → Collectors → DiscoveryContext
 *   → Indexing → ExtractionContext
 *   → Extractors → Fields
 *   → Merger → Product
 *   → Validation → Final Product
 *
 * Designed for resilience: survives frontend rewrites via recursive discovery,
 * never depends on CSS classes, uses signal dictionary.
 *
 * @module core
 */

import { BrandExtractor, ModelExtractor } from '../extractors/product/BrandExtractor.js';
import { BreadcrumbExtractor } from '../extractors/product/BreadcrumbExtractor.js';
import { CategoryExtractor, CategoryIdsExtractor } from '../extractors/product/CategoryExtractor.js';
import { ProductIdExtractor } from '../extractors/product/ProductIdExtractor.js';
import { SubtitleExtractor } from '../extractors/product/SubtitleExtractor.js';
import { TitleExtractor } from '../extractors/product/TitleExtractor.js';
import { logger, type ILogger } from '../utils/Logger.js';
import { DEFAULT_ENGINE_CONFIG } from './config/EngineConfig.js';
import { CompositeCollector } from './discovery/collectors/CompositeCollector.js';
import { ExtractionContext } from './extraction/ExtractionContext.js';
import { ExtractorRegistry } from './extraction/ExtractorRegistry.js';
import { ResultMerger } from './merger/ResultMerger.js';
import { ProductValidator } from './validation/ProductValidator.js';
import { Pipeline } from './pipeline/Pipeline.js';
import { PipelineRunner } from './pipeline/PipelineRunner.js';
import { CollectionStage } from './pipeline/stages/CollectionStage.js';
import { IndexingStage } from './pipeline/stages/IndexingStage.js';
import { ExtractionStage } from './pipeline/stages/ExtractionStage.js';
import { MergingStage } from './pipeline/stages/MergingStage.js';
import { NormalizationStage } from './pipeline/stages/NormalizationStage.js';
import { ValidationStage } from './pipeline/stages/ValidationStage.js';
import type { PipelineContext } from './pipeline/PipelineStage.js';

// Import all extractors to build default registry
import { UrlExtractor, CanonicalUrlExtractor } from '../extractors/product/UrlExtractor.js';
import { DescriptionExtractor, HtmlDescriptionExtractor } from '../extractors/product/DescriptionExtractor.js';
import { PriceExtractor } from '../extractors/price/PriceExtractor.js';
import { OriginalPriceExtractor, SalePriceExtractor, PriceRangeExtractor } from '../extractors/price/OriginalPriceExtractor.js';
import { CurrencyExtractor, CurrencySymbolExtractor, DiscountExtractor } from '../extractors/price/CurrencyExtractor.js';
import { CouponExtractor, PromotionExtractor, FlashDealsExtractor } from '../extractors/price/CouponExtractor.js';
import { ChoiceBadgeExtractor, PlusBadgeExtractor, TopBrandBadgeExtractor } from '../extractors/badges/BadgeExtractor.js';
import { StockExtractor, InventoryExtractor, AvailabilityExtractor, WarehouseExtractor } from '../extractors/inventory/StockExtractor.js';
import { OrdersExtractor, SalesExtractor, WishlistExtractor, FavoriteCountExtractor } from '../extractors/orders/OrdersExtractor.js';
import {
  ShipFromExtractor,
  ShipsToExtractor,
  EstimatedDeliveryExtractor,
  DeliveryRangeExtractor,
  ShippingCompaniesExtractor,
  ShippingCostExtractor,
  ShippingCurrencyExtractor,
  ShippingMethodsExtractor,
} from '../extractors/shipping/ShippingExtractor.js';
import {
  SellerExtractor,
  StoreExtractor,
  StoreIdExtractor,
  StoreUrlExtractor,
  StoreLevelExtractor,
  FollowersExtractor,
  PositiveFeedbackExtractor,
} from '../extractors/seller/SellerExtractor.js';
import {
  ReviewCountExtractor,
  AverageRatingExtractor,
  RatingBreakdownExtractor,
  ReviewTagsExtractor,
} from '../extractors/rating/RatingExtractor.js';
import {
  ImagesExtractor,
  MainImageExtractor,
  GalleryExtractor,
  VariantImagesExtractor,
  SkuImagesExtractor,
  VideosExtractor,
  VideoThumbnailExtractor,
  VideoDurationExtractor,
} from '../extractors/media/MediaExtractor.js';
import {
  SpecificationsExtractor,
  AttributesExtractor,
  PackageContentsExtractor,
  DimensionsExtractor,
  WeightExtractor,
} from '../extractors/specifications/SpecificationExtractor.js';
import {
  SkuPropertiesExtractor,
  SkuMappingExtractor,
  SkuInventoryExtractor,
  SkuPricesExtractor,
  SkuIdsExtractor,
  SkuPromotionsExtractor,
} from '../extractors/sku/SkuExtractor.js';

import type { EngineConfig } from './config/EngineConfig.js';
import type { DiscoveryContext } from '../types/discovery/DiscoveryTypes.js';
import type { AliExpressProduct } from '../types/product/Product.js';

export interface ExtractionInput {
  readonly url: string;
  readonly html?: string;
  readonly windowObjects?: Record<string, unknown>;
  readonly networkResponses?: readonly { url: string; body: unknown }[];
}

export interface ExtractionResult {
  readonly product: AliExpressProduct;
  readonly discovery: DiscoveryContext;
  readonly errors: readonly Error[];
  readonly warnings: readonly string[];
  readonly performance: {
    readonly totalTimeMs: number;
    readonly collectionTimeMs: number;
    readonly indexingTimeMs: number;
    readonly extractionTimeMs: number;
    readonly mergingTimeMs: number;
    readonly validationTimeMs: number;
    readonly sources: number;
    readonly fields: number;
    readonly averageConfidence: number;
  };
}

export class ProductExtractionEngine {
  private readonly config: EngineConfig;
  private readonly registry: ExtractorRegistry;
  private readonly collector: CompositeCollector;
  private readonly merger: ResultMerger;
  private readonly validator: ProductValidator;
  private readonly logger: ILogger;

  constructor(config?: Partial<EngineConfig>, customRegistry?: ExtractorRegistry) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
    this.logger = logger.child('ProductExtractionEngine');
    this.collector = new CompositeCollector();
    this.merger = new ResultMerger();
    this.validator = new ProductValidator();
    this.registry = customRegistry ?? this.createDefaultRegistry();
  }

  /**
   * Creates default registry with all extractors
   */
  private createDefaultRegistry(): ExtractorRegistry {
    const registry = new ExtractorRegistry();
    const extractors = [
      new TitleExtractor(),
      new SubtitleExtractor(),
      new ProductIdExtractor(),
      new UrlExtractor(),
      new CanonicalUrlExtractor(),
      new CategoryExtractor(),
      new CategoryIdsExtractor(),
      new BreadcrumbExtractor(),
      new BrandExtractor(),
      new ModelExtractor(),
      new DescriptionExtractor(),
      new HtmlDescriptionExtractor(),

      new PriceExtractor(),
      new OriginalPriceExtractor(),
      new SalePriceExtractor(),
      new PriceRangeExtractor(),
      new CurrencyExtractor(),
      new CurrencySymbolExtractor(),
      new DiscountExtractor(),
      new CouponExtractor(),
      new PromotionExtractor(),
      new FlashDealsExtractor(),

      new ChoiceBadgeExtractor(),
      new PlusBadgeExtractor(),
      new TopBrandBadgeExtractor(),

      new StockExtractor(),
      new InventoryExtractor(),
      new AvailabilityExtractor(),
      new WarehouseExtractor(),

      new OrdersExtractor(),
      new SalesExtractor(),
      new WishlistExtractor(),
      new FavoriteCountExtractor(),

      new ShipFromExtractor(),
      new ShipsToExtractor(),
      new EstimatedDeliveryExtractor(),
      new DeliveryRangeExtractor(),
      new ShippingCompaniesExtractor(),
      new ShippingCostExtractor(),
      new ShippingCurrencyExtractor(),
      new ShippingMethodsExtractor(),

      new SellerExtractor(),
      new StoreExtractor(),
      new StoreIdExtractor(),
      new StoreUrlExtractor(),
      new StoreLevelExtractor(),
      new FollowersExtractor(),
      new PositiveFeedbackExtractor(),

      new ReviewCountExtractor(),
      new AverageRatingExtractor(),
      new RatingBreakdownExtractor(),
      new ReviewTagsExtractor(),

      new ImagesExtractor(),
      new MainImageExtractor(),
      new GalleryExtractor(),
      new VariantImagesExtractor(),
      new SkuImagesExtractor(),
      new VideosExtractor(),
      new VideoThumbnailExtractor(),
      new VideoDurationExtractor(),

      new SpecificationsExtractor(),
      new AttributesExtractor(),
      new PackageContentsExtractor(),
      new DimensionsExtractor(),
      new WeightExtractor(),

      new SkuPropertiesExtractor(),
      new SkuMappingExtractor(),
      new SkuInventoryExtractor(),
      new SkuPricesExtractor(),
      new SkuIdsExtractor(),
      new SkuPromotionsExtractor(),
    ];

    registry.registerMany(extractors);
    return registry;
  }

  /**
   * Main extraction entry point
   */
  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const overallStart = Date.now();
    const pipelineContext: PipelineContext = {
      url: input.url,
      ...(input.html !== undefined ? { html: input.html } : {}),
      ...(input.windowObjects !== undefined ? { windowObjects: input.windowObjects } : {}),
      ...(input.networkResponses !== undefined ? { networkResponses: input.networkResponses } : {}),
      config: this.config,
      startTime: overallStart,
      metadata: new Map(),
    };

    // Build pipeline
    const pipeline = new Pipeline<void, AliExpressProduct>('aliexpress-extraction')
      .addStage(new CollectionStage(this.collector))
      .addStage(new IndexingStage())
      .addStage(new ExtractionStage(this.registry))
      .addStage(new MergingStage(this.merger))
      .addStage(new NormalizationStage())
      .addStage(new ValidationStage(this.validator));

    const runner = new PipelineRunner({ timeoutMs: this.config.timeoutMs, retries: 0 });

    const pipelineResult = await runner.run(pipeline, pipelineContext, undefined);

    // Extract stage results for performance metrics
    const findDuration = (stageId: string): number => {
      const stage = pipelineResult.stageResults.find(r => r.stageId === stageId);
      return stage?.durationMs ?? 0;
    };

    const collectionTime = findDuration('collection');
    const indexingTime = findDuration('indexing');
    const extractionTime = findDuration('extraction');
    const mergingTime = findDuration('merging');
    const validationTime = findDuration('validation');

    // Get final product
    const finalProduct = pipelineResult.finalOutput as AliExpressProduct | undefined;

    if (!finalProduct) {
      throw new Error(`Extraction pipeline failed: ${pipelineResult.errors.map(e => e.message).join(', ')}`);
    }

    // Get discovery context from first stage
    const collectionStage = pipelineResult.stageResults.find(r => r.stageId === 'collection');
    const discovery = (collectionStage?.data as DiscoveryContext) ?? {
      sources: [],
      url: input.url,
      timestamp: Date.now(),
    };

    const fieldsCount = Object.values(finalProduct).filter(v => v !== null && typeof v === 'object' && 'value' in (v as object)).length;

    const performance = {
      totalTimeMs: Date.now() - overallStart,
      collectionTimeMs: collectionTime,
      indexingTimeMs: indexingTime,
      extractionTimeMs: extractionTime,
      mergingTimeMs: mergingTime,
      validationTimeMs: validationTime,
      sources: discovery.sources.length,
      fields: fieldsCount,
      averageConfidence: finalProduct._extractionMeta?.averageConfidence ?? 0,
    };

    return {
      product: {
        ...finalProduct,
        _extractionMeta: {
          totalSources: discovery.sources.length,
          totalFields: fieldsCount,
          averageConfidence: performance.averageConfidence,
          extractionTimeMs: performance.totalTimeMs,
        },
        ...(this.config.includeRawData ? { _raw: discovery } : {}),
      },
      discovery,
      errors: pipelineResult.errors,
      warnings: pipelineResult.warnings,
      performance,
    };
  }

  getRegistry(): ExtractorRegistry {
    return this.registry;
  }

  getConfig(): EngineConfig {
    return this.config;
  }
}

/**
 * Convenience singleton for quick usage
 */
let defaultEngine: ProductExtractionEngine | undefined;

export function getDefaultEngine(config?: Partial<EngineConfig>): ProductExtractionEngine {
  if (!defaultEngine || config) {
    defaultEngine = new ProductExtractionEngine(config);
  }
  return defaultEngine;
}
