export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function safeDiv(numerator: number, denominator: number, fallback = 0): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }
  return numerator / denominator;
}

export function normalizeScores<T extends object>(scores: T): T {
  const entries = Object.entries(scores as Record<string, number>);
  const sum = entries.reduce((acc, [, value]) => acc + Math.max(0, value), 0);
  if (sum <= 0) {
    const keys = Object.keys(scores as Record<string, number>);
    const even = 1 / keys.length;
    return keys.reduce((acc, key) => {
      acc[key as keyof T] = even as T[keyof T];
      return acc;
    }, {} as T);
  }

  return entries.reduce((acc, [key, value]) => {
    acc[key as keyof T] = (Math.max(0, value) / sum) as T[keyof T];
    return acc;
  }, {} as T);
}
