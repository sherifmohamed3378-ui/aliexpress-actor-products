import { describe, it, expect } from 'vitest';
import { Pipeline } from '../../src/core/pipeline/Pipeline.js';
import { CollectionStage } from '../../src/core/pipeline/stages/CollectionStage.js';
import { IndexingStage } from '../../src/core/pipeline/stages/IndexingStage.js';
import { EngineConfigFactory } from '../../src/core/config/EngineConfig.js';
import type { PipelineContext } from '../../src/core/pipeline/PipelineStage.js';

describe('Pipeline', () => {
  it('runs collection and indexing stages', async () => {
    const pipeline = new Pipeline<void, unknown>('test-pipeline')
      .addStage(new CollectionStage())
      .addStage(new IndexingStage());

    const context: PipelineContext = {
      url: 'https://www.aliexpress.com/item/123.html',
      html: '<html><body><h1>Test</h1></body></html>',
      config: EngineConfigFactory.create(),
      startTime: Date.now(),
      metadata: new Map(),
    };

    const result = await pipeline.run(context, undefined);

    expect(result.success).toBe(true);
    expect(result.stageResults.length).toBe(2);
    expect(result.stageResults[0]?.success).toBe(true);
  });

  it('handles stage failure gracefully', async () => {
    const { PipelineStage } = await import('../../src/core/pipeline/PipelineStage.js');

    class FailingStage extends PipelineStage<void, void> {
      override readonly id = 'collection'; // critical stage to force abort
      override async execute(): Promise<import('../../src/core/pipeline/PipelineStage.js').StageResult<void>> {
        return {
          success: false,
          error: new Error('Intentional failure'),
          durationMs: 10,
          stageId: this.id,
          warnings: [],
        };
      }
    }

    const pipeline = new Pipeline<void, void>('failing-pipeline').addStage(new FailingStage()).addStage(new CollectionStage());

    const context: PipelineContext = {
      url: 'https://example.com',
      config: EngineConfigFactory.create(),
      startTime: Date.now(),
      metadata: new Map(),
    };

    const result = await pipeline.run(context, undefined);

    // Critical stage failure should abort and report errors
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.stageResults[0]?.success).toBe(false);
  });
});
