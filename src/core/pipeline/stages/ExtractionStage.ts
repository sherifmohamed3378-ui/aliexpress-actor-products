/**
 * ExtractionStage.ts
 * Runs all registered extractors against the extraction context.
 *
 * @module core/pipeline/stages
 */

import { logger } from '../../../utils/Logger.js';
import { PipelineStage, type PipelineContext, type StageResult } from '../PipelineStage.js';

import type { Field } from '../../../types/common/Field.js';
import type { ExtractionContext } from '../../extraction/ExtractionContext.js';
import type { ExtractorRegistry } from '../../extraction/ExtractorRegistry.js';

export class ExtractionStage extends PipelineStage<ExtractionContext, Map<string, Field<unknown> | null>> {
  override readonly id = 'extraction';
  private readonly log = logger.child(this.id);

  constructor(private readonly registry: ExtractorRegistry) {
    super();
  }

  override async execute(context: PipelineContext, input: ExtractionContext): Promise<StageResult<Map<string, Field<unknown> | null>>> {
    const start = Date.now();
    const warnings: string[] = [];

    try {
      const results = await this.registry.extractAll(input);

      // Filter by enabled/disabled extractors from config
      let filtered = results;
      if (context.config.enabledExtractors && context.config.enabledExtractors.length > 0) {
        const enabledSet = new Set(context.config.enabledExtractors);
        filtered = new Map([...results.entries()].filter(([k]) => enabledSet.has(k)));
      }
      if (context.config.disabledExtractors.length > 0) {
        const disabledSet = new Set(context.config.disabledExtractors);
        filtered = new Map([...filtered.entries()].filter(([k]) => !disabledSet.has(k)));
      }

      // Confidence threshold filtering for warnings
      for (const [key, field] of filtered.entries()) {
        if (field && field.confidence < context.config.confidenceThreshold) {
          warnings.push(`Field ${key} below confidence threshold: ${field.confidence.toFixed(2)} < ${context.config.confidenceThreshold}`);
        }
      }

      const extractedCount = Array.from(filtered.values()).filter(v => v !== null).length;
      this.log.info(`Extraction complete`, { extractedCount, total: filtered.size });

      return {
        success: true,
        data: filtered,
        durationMs: Date.now() - start,
        stageId: this.id,
        warnings,
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
