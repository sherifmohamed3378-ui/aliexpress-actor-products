/**
 * PipelineStage.ts
 * Modular pipeline stage abstraction - pluggable, testable, composable.
 *
 * @module core/pipeline
 */

export interface PipelineContext {
  readonly url: string;
  readonly html?: string;
  readonly windowObjects?: Record<string, unknown>;
  readonly networkResponses?: readonly { url: string; body: unknown }[];
  readonly config: import('../config/EngineConfig.js').EngineConfig;
  readonly startTime: number;
  readonly metadata: Map<string, unknown>;
}

/**
 * Result of a single stage execution
 */
export interface StageResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: Error;
  readonly durationMs: number;
  readonly stageId: string;
  readonly warnings: readonly string[];
}

/**
 * Abstract pipeline stage - SOLID, testable, single responsibility
 */
export abstract class PipelineStage<TInput = unknown, TOutput = unknown> {
  abstract readonly id: string;

  /**
   * Whether this stage can be skipped
   */
  canSkip?(context: PipelineContext, input: TInput): boolean;

  /**
   * Execute the stage
   */
  abstract execute(context: PipelineContext, input: TInput): Promise<StageResult<TOutput>>;

  /**
   * Optional cleanup after execution
   */
  cleanup?(): Promise<void>;
}

/**
 * Factory for creating inline stages without class boilerplate
 */
export function createStage<TInput, TOutput>(
  id: string,
  executor: (context: PipelineContext, input: TInput) => Promise<TOutput>,
  canSkipFn?: (context: PipelineContext, input: TInput) => boolean
): PipelineStage<TInput, TOutput> {
  return new (class extends PipelineStage<TInput, TOutput> {
    override readonly id = id;

    override async execute(context: PipelineContext, input: TInput): Promise<StageResult<TOutput>> {
      const start = Date.now();
      try {
        const data = await executor(context, input);
        return {
          success: true,
          data,
          durationMs: Date.now() - start,
          stageId: id,
          warnings: [],
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err : new Error(String(err)),
          durationMs: Date.now() - start,
          stageId: id,
          warnings: [],
        };
      }
    }

    override canSkip(context: PipelineContext, input: TInput): boolean {
      return canSkipFn ? canSkipFn(context, input) : false;
    }
  })();
}
