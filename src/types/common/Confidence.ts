export interface ConfidenceDetail {
  readonly baseScore: number;
  readonly adjustments: readonly {
    readonly reason: string;
    readonly delta: number;
  }[];
  readonly finalScore: number;
}

export function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function calculateFinalConfidence(
  base: number,
  adjustments: readonly { delta: number }[]
): number {
  const sum = adjustments.reduce((acc, cur) => acc + cur.delta, 0);
  return clampConfidence(base + sum);
}
