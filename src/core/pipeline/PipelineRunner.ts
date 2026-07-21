/**
 * PipelineRunner.ts
 * Executes pipelines with timeout, retry, and observability.
 *
 * @module core/pipeline
 */

import { logger } from '../../utils/Logger.js';

import type { Pipeline, PipelineResult } from './Pipeline.js';
import type { PipelineContext } from './PipelineStage.js';

export interface RunnerOptions {
  readonly timeoutMs: number;
  readonly retries: number;
  readonly onStageComplete?: (stageId: string, durationMs: number) => void;
  readonly onError?: (error: Error, stageId?: string) => void;
}

export const DEFAULT_RUNNER_OPTIONS: RunnerOptions = {
  timeoutMs: 30000,
  retries: 0,
} as const;

export class PipelineRunner {
  private readonly log = logger.child('PipelineRunner');

  constructor(private readonly options: RunnerOptions = DEFAULT_RUNNER_OPTIONS) {}

  async run<TInitial, TFinal>(
    pipeline: Pipeline<TInitial, TFinal>,
    context: PipelineContext,
    initialInput: TInitial
  ): Promise<PipelineResult<TFinal>> {
    const start = Date.now();
    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt <= this.options.retries) {
      try {
        this.log.info(`Runner starting pipeline ${pipeline.id}, attempt ${attempt + 1}`, { url: context.url });

        const result = await this.runWithTimeout(pipeline, context, initialInput, this.options.timeoutMs);

        if (result.success) {
          this.log.info(`Pipeline ${pipeline.id} succeeded on attempt ${attempt + 1}`, {
            totalDurationMs: Date.now() - start,
          });
          return result;
        }

        lastError = result.errors[0];
        this.log.warn(`Pipeline ${pipeline.id} failed on attempt ${attempt + 1}`, {
          error: lastError?.message,
        });

        if (attempt >= this.options.retries) return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.log.error(`Pipeline ${pipeline.id} threw on attempt ${attempt + 1}`, { error: lastError.message });
        this.options.onError?.(lastError);

        if (attempt >= this.options.retries) {
          return {
            success: false,
            stageResults: [],
            totalDurationMs: Date.now() - start,
            errors: [lastError],
            warnings: [],
          };
        }
      }

      attempt++;
      // Exponential backoff
      await this.sleep(500 * Math.pow(2, attempt));
    }

    return {
      success: false,
      stageResults: [],
      totalDurationMs: Date.now() - start,
      errors: lastError ? [lastError] : [new Error('Pipeline failed after retries')],
      warnings: [],
    };
  }

  private async runWithTimeout<TInitial, TFinal>(
    pipeline: Pipeline<TInitial, TFinal>,
    context: PipelineContext,
    initialInput: TInitial,
    timeoutMs: number
  ): Promise<PipelineResult<TFinal>> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Pipeline ${pipeline.id} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      pipeline
        .run(context, initialInput)
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
