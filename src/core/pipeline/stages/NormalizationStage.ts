/**
 * NormalizationStage.ts
 * Final cleanup and normalization of product data.
 *
 * @module core/pipeline/stages
 */

import { logger } from '../../../utils/Logger.js';
import { PipelineStage, type PipelineContext, type StageResult } from '../PipelineStage.js';

import type { AliExpressProduct } from '../../../types/product/Product.js';

export class NormalizationStage extends PipelineStage<AliExpressProduct, AliExpressProduct> {
  override readonly id = 'normalization';
  private readonly log = logger.child(this.id);

  override async execute(_context: PipelineContext, input: AliExpressProduct): Promise<StageResult<AliExpressProduct>> {
    const start = Date.now();
    try {
      // Currently product is already normalized by extractors + normalizers
      // This stage is placeholder for future global normalization, e.g., ensuring URL consistency
      let product = input;

      // Ensure canonical URL fallback
      if (!product.canonicalUrl && product.url?.value) {
        product = {
          ...product,
          canonicalUrl: product.url,
        };
      }

      // Ensure gallery fallback from images
      if (!product.gallery && product.images?.value) {
        product = {
          ...product,
          gallery: product.images,
        };
      }

      return {
        success: true,
        data: product,
        durationMs: Date.now() - start,
        stageId: this.id,
        warnings: [],
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error(String(err)),
        durationMs: Date.now() - start,
        stageId: this.id,
        warnings: [],
      };
    }
  }
}
