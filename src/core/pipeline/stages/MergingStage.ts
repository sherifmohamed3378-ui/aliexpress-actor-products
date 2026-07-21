/**
 * MergingStage.ts
 *
 * @module core/pipeline/stages
 */

import { ResultMerger } from '../../merger/ResultMerger.js';
import { PipelineStage, type PipelineContext, type StageResult } from '../PipelineStage.js';

import type { Field } from '../../../types/common/Field.js';
import type { AliExpressProduct } from '../../../types/product/Product.js';

export class MergingStage extends PipelineStage<Map<string, Field<unknown> | null>, AliExpressProduct> {
  override readonly id = 'merging';
  private readonly merger: ResultMerger;

  constructor(merger?: ResultMerger) {
    super();
    this.merger = merger ?? new ResultMerger();
  }

  override async execute(context: PipelineContext, input: Map<string, Field<unknown> | null>): Promise<StageResult<AliExpressProduct>> {
    const start = Date.now();
    try {
      const product = this.merger.merge(input, {
        preserveAlternatives: context.config.preserveAlternatives,
        maxAlternatives: context.config.maxAlternatives,
        confidenceThreshold: context.config.confidenceThreshold,
      });

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
