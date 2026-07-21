export class PathMatcher {
  static matchExact(path: string, target: string, caseSensitive = false): boolean {
    if (caseSensitive) return path === target;
    return path.toLowerCase() === target.toLowerCase();
  }

  static matchKey(key: string, signals: readonly string[], caseSensitive = false, exact = true): boolean {
    const compare = (a: string, b: string): boolean => {
      if (caseSensitive) return exact ? a === b : a.includes(b);
      const al = a.toLowerCase();
      const bl = b.toLowerCase();
      return exact ? al === bl : al.includes(bl);
    };

    return signals.some(signal => compare(key, signal));
  }

  static buildPath(parentPath: string, key: string | number): string {
    if (!parentPath) return String(key);
    if (typeof key === 'number') return `${parentPath}[${key}]`;
    // If key contains dots or special chars, use bracket notation
    if (/[^a-zA-Z0-9_$]/.test(key)) return `${parentPath}["${key}"]`;
    return `${parentPath}.${key}`;
  }

  static getDepth(path: string): number {
    if (!path) return 0;
    // Count dots and brackets
    return (path.match(/\./g) ?? []).length + (path.match(/\[/g) ?? []).length;
  }

  static extractLastKey(path: string): string {
    const parts = path.split('.');
    const last = parts[parts.length - 1] ?? '';
    // Remove bracket parts
    return last.replace(/\[.*\]$/, '');
  }

  static isLikelyProductPath(path: string): boolean {
    const lowered = path.toLowerCase();
    return (
      lowered.includes('product') ||
      lowered.includes('item') ||
      lowered.includes('sku') ||
      lowered.includes('price') ||
      lowered.includes('trade')
    );
  }
}
