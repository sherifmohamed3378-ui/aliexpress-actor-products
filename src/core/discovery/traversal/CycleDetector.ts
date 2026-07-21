/**
 * CycleDetector.ts
 * Detects circular references to avoid infinite recursion.
 */

export class CycleDetector {
  private seen = new WeakSet<object>();
  private readonly stack: object[] = [];

  enter(obj: object): boolean {
    if (this.seen.has(obj)) {
      return false; // Cycle detected
    }
    this.seen.add(obj);
    this.stack.push(obj);
    return true;
  }

  leave(obj: object): void {
    const idx = this.stack.lastIndexOf(obj);
    if (idx !== -1) {
      this.stack.splice(idx, 1);
    }
    // Note: We keep in seen WeakSet to prevent revisiting same object via different path if desired
    // For traversal we might want to allow revisiting but via path tracking - configurable
  }

  hasSeen(obj: object): boolean {
    return this.seen.has(obj);
  }

  depth(): number {
    return this.stack.length;
  }

  reset(): void {
    // WeakSet cannot be cleared directly, recreate
    this.seen = new WeakSet<object>();
    this.stack.length = 0;
  }

  clone(): CycleDetector {
    const clone = new CycleDetector();
    for (const obj of this.stack) {
      clone.seen.add(obj);
      clone.stack.push(obj);
    }
    return clone;
  }
}

export class PathCycleDetector {
  private readonly pathNodes = new Set<string>();

  check(path: string): boolean {
    if (this.pathNodes.has(path)) return false;
    this.pathNodes.add(path);
    return true;
  }
}
