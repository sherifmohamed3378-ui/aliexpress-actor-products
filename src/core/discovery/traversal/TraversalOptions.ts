export interface TraversalOptions {
  readonly maxDepth: number;
  readonly maxKeys: number;
  readonly detectCycles: boolean;
  readonly includeArrays: boolean;
  readonly includePrototype: boolean;
  readonly includeNull?: boolean;
  readonly earlyExit?: (path: string, depth: number, keysSeen: number) => boolean;
}

export const DEFAULT_TRAVERSAL_OPTIONS: TraversalOptions = {
  maxDepth: 25,
  maxKeys: 50000,
  detectCycles: true,
  includeArrays: true,
  includePrototype: false,
  includeNull: false,
} as const;

export interface SearchOptions extends TraversalOptions {
  readonly caseSensitive: boolean;
  readonly exactMatch: boolean;
  readonly includeNull: boolean;
}

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  ...DEFAULT_TRAVERSAL_OPTIONS,
  caseSensitive: false,
  exactMatch: true,
  includeNull: false,
} as const;
