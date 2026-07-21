/**
 * IndexingStage.ts
 *
 * @module core/pipeline/stages
 */

import { logger } from '../../../utils/Logger.js';
import { ExtractionContext } from '../../extraction/ExtractionContext.js';
import { PipelineStage, type PipelineContext, type StageResult } from '../PipelineStage.js';

import type { DiscoveryContext } from '../../../types/discovery/DiscoveryTypes.js';

export class IndexingStage extends PipelineStage<DiscoveryContext, ExtractionContext> {
  override readonly id = 'indexing';
  private readonly log = logger.child(this.id);

  override async execute(context: PipelineContext, input: DiscoveryContext): Promise<StageResult<ExtractionContext>> {
    const start = Date.now();
    try {
      const extractionContext = new ExtractionContext(input, this.log);

      return {
        success: true,
        data: extractionContext,
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
