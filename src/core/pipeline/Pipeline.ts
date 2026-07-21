/**
 * Pipeline.ts
 * Orchestrates pipeline stages sequentially with error isolation and performance tracking.
 *
 * @module core/pipeline
 */

import { logger } from '../../utils/Logger.js';

import type { PipelineContext, PipelineStage, StageResult } from './PipelineStage.js';

export interface PipelineResult<T = unknown> {
  readonly success: boolean;
  readonly finalOutput?: T;
  readonly stageResults: readonly StageResult[];
  readonly totalDurationMs: number;
  readonly errors: readonly Error[];
  readonly warnings: readonly string[];
}

export class Pipeline<TInitial = unknown, TFinal = unknown> {
  private readonly stages: PipelineStage<unknown, unknown>[] = [];
  private readonly log = logger.child('Pipeline');

  constructor(readonly id: string) {}

  addStage<TIn, TOut>(stage: PipelineStage<TIn, TOut>): this {
    this.stages.push(stage as unknown as PipelineStage<unknown, unknown>);
    return this;
  }

  addStages(stages: readonly PipelineStage<unknown, unknown>[]): this {
    for (const s of stages) this.addStage(s);
    return this;
  }

  async run(context: PipelineContext, initialInput: TInitial): Promise<PipelineResult<TFinal>> {
    const start = Date.now();
    const stageResults: StageResult[] = [];
    const errors: Error[] = [];
    const warnings: string[] = [];

    let currentOutput: unknown = initialInput;

    this.log.info(`Pipeline ${this.id} starting with ${this.stages.length} stages`, { url: context.url });

    for (const stage of this.stages) {
      const stageStart = Date.now();

      try {
        if (stage.canSkip?.(context, currentOutput) ?? false) {
          this.log.debug(`Stage ${stage.id} skipped`);
          stageResults.push({
            success: true,
            data: currentOutput,
            durationMs: Date.now() - stageStart,
            stageId: stage.id,
            warnings: [],
          });
          continue;
        }

        this.log.debug(`Executing stage ${stage.id}`);
        const result = await stage.execute(context, currentOutput);

        stageResults.push(result);

        if (!result.success) {
          const err = result.error ?? new Error(`Stage ${stage.id} failed without error`);
          errors.push(err);
          this.log.warn(`Stage ${stage.id} failed`, { error: err.message, durationMs: result.durationMs });

          // In strict mode? For now continue but mark pipeline as failed if critical stage fails
          // Collection and Extraction are critical, others not
          if (this.isCriticalStage(stage.id)) {
            this.log.error(`Critical stage ${stage.id} failed, aborting pipeline`);
            break;
          }

          warnings.push(...result.warnings);
          continue;
        }

        if (result.warnings.length > 0) {
          warnings.push(...result.warnings);
        }

        currentOutput = result.data;
        this.log.debug(`Stage ${stage.id} completed in ${result.durationMs}ms`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        errors.push(error);
        stageResults.push({
          success: false,
          error,
          durationMs: Date.now() - stageStart,
          stageId: stage.id,
          warnings: [],
        });
        this.log.error(`Stage ${stage.id} threw`, { error: error.message });
        if (this.isCriticalStage(stage.id)) break;
      }
    }

    const totalDuration = Date.now() - start;

    const success = errors.length === 0 || stageResults.some(r => r.success);

    this.log.info(`Pipeline ${this.id} finished`, {
      success,
      totalDurationMs: totalDuration,
      stageCount: this.stages.length,
      errorCount: errors.length,
    });

    return {
      success,
      finalOutput: currentOutput as TFinal,
      stageResults,
      totalDurationMs: totalDuration,
      errors,
      warnings,
    };
  }

  private isCriticalStage(stageId: string): boolean {
    return ['collection', 'extraction'].includes(stageId);
  }

  getStageIds(): readonly string[] {
    return this.stages.map(s => s.id);
  }

  clear(): void {
    this.stages.length = 0;
  }

  size(): number {
    return this.stages.length;
  }
}
