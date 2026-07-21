/**
 * CollectionStage.ts
 *
 * @module core/pipeline/stages
 */

import { CompositeCollector } from '../../discovery/collectors/CompositeCollector.js';
import { PipelineStage, type PipelineContext, type StageResult } from '../PipelineStage.js';

import type { DiscoveryContext } from '../../../types/discovery/DiscoveryTypes.js';

export class CollectionStage extends PipelineStage<void, DiscoveryContext> {
  override readonly id = 'collection';
  private readonly collector: CompositeCollector;

  constructor(collector?: CompositeCollector) {
    super();
    this.collector = collector ?? new CompositeCollector();
  }

  override async execute(context: PipelineContext, _input: void): Promise<StageResult<DiscoveryContext>> {
    const start = Date.now();
    try {
      const collectionInput: import('../../discovery/collectors/ICollector.js').ICollectionContext = {
        url: context.url,
        ...(context.html !== undefined ? { html: context.html } : {}),
        ...(context.windowObjects !== undefined ? { windowObjects: context.windowObjects } : {}),
        ...(context.networkResponses !== undefined ? { networkResponses: context.networkResponses } : {}),
      };
      const discoveryContext = await this.collector.collect(collectionInput);

      return {
        success: true,
        data: discoveryContext,
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
