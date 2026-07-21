/**
 * ValidationStage.ts
 * Validates final product against business rules.
 *
 * @module core/pipeline/stages
 */

import { ProductValidator } from '../../validation/ProductValidator.js';
import { PipelineStage, type PipelineContext, type StageResult } from '../PipelineStage.js';

import type { AliExpressProduct } from '../../../types/product/Product.js';

export class ValidationStage extends PipelineStage<AliExpressProduct, AliExpressProduct> {
  override readonly id = 'validation';
  private readonly validator: ProductValidator;

  constructor(validator?: ProductValidator) {
    super();
    this.validator = validator ?? new ProductValidator();
  }

  override async execute(context: PipelineContext, input: AliExpressProduct): Promise<StageResult<AliExpressProduct>> {
    const start = Date.now();
    const warnings: string[] = [];

    try {
      const result = this.validator.validate(input);

      if (!result.valid && context.config.strictMode) {
        return {
          success: false,
          error: new Error(`Product validation failed: ${result.errors.join(', ')}`),
          durationMs: Date.now() - start,
          stageId: this.id,
          warnings: result.warnings,
        };
      }

      // In non-strict mode, even invalid product passes with warnings
      return {
        success: true,
        data: input,
        durationMs: Date.now() - start,
        stageId: this.id,
        warnings: [...result.errors, ...result.warnings],
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error(String(err)),
        durationMs: Date.now() - start,
        stageId: this.id,
        warnings,
      };
    }
  }
}
