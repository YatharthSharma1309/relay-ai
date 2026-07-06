export function parseStringArray(json: string): string[] {
  try {
    const value = JSON.parse(json) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function stringifyStringArray(items: string[]): string {
  return JSON.stringify(items);
}

export function parseJsonObject<T>(json: string, fallback: T): T {
  try {
    const value = JSON.parse(json) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return fallback;
    }
    return value as T;
  } catch {
    return fallback;
  }
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value);
}
