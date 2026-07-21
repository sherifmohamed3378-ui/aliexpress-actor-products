export interface ScoredValue<T> {
  readonly value: T;
  readonly confidence: number;
  readonly sourcePath: string;
}
