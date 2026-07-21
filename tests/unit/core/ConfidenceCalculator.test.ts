import { describe, it, expect } from 'vitest';
import { ConfidenceCalculator } from '../../../src/core/extraction/Confidence/ConfidenceCalculator.js';
import { SourceType } from '../../../src/constants/ConfidenceWeights.js';

describe('ConfidenceCalculator', () => {
  it('calculates base confidence by source type', () => {
    const calc = new ConfidenceCalculator();
    const result = calc.calculate({
      sourceType: SourceType.WINDOW_OBJECT,
      path: 'data.subject',
      key: 'subject',
      matchedSignal: 'subject',
      value: 'Test Product',
      depth: 2,
      hasAlternatives: false,
      validationPassed: true,
    });
    expect(result.final).toBeGreaterThan(0.8);
  });

  it('applies depth penalty', () => {
    const calc = new ConfidenceCalculator();
    const shallow = calc.calculate({
      sourceType: SourceType.WINDOW_OBJECT,
      path: 'a',
      key: 'subject',
      matchedSignal: 'subject',
      value: 'test',
      depth: 2,
      hasAlternatives: false,
      validationPassed: true,
    });
    const deep = calc.calculate({
      sourceType: SourceType.WINDOW_OBJECT,
      path: 'a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t',
      key: 'subject',
      matchedSignal: 'subject',
      value: 'test',
      depth: 25,
      hasAlternatives: false,
      validationPassed: true,
    });
    expect(shallow.final).toBeGreaterThan(deep.final);
    expect(deep.final).toBeLessThan(1);
  });

  it('merges confidences with boost', () => {
    const calc = new ConfidenceCalculator();
    const merged = calc.mergeConfidences([0.8, 0.85]);
    expect(merged).toBeGreaterThan(0.8);
  });
});
