export function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  const memoized = (...args: unknown[]): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  };
  return memoized as unknown as T;
}

export function memoizeWeak<K extends object, V>(fn: (key: K) => V): (key: K) => V {
  const cache = new WeakMap<K, V>();
  return (key: K): V => {
    if (cache.has(key)) {
      return cache.get(key) as V;
    }
    const result = fn(key);
    cache.set(key, result);
    return result;
  };
}
