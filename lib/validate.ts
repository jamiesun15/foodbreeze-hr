export function isValidYear(value: string | null): boolean {
  if (!value) return false;
  return /^\d{4}$/.test(value);
}

export function isValidMonth(value: string | null): boolean {
  if (!value) return false;
  const num = parseInt(value);
  return /^\d{1,2}$/.test(value) && num >= 1 && num <= 12;
}

export function isValidDate(value: string | null): boolean {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isValidTime(value: string | null): boolean {
  if (!value) return false;
  return /^\d{2}:\d{2}$/.test(value);
}

export function sanitizeString(value: string | null | undefined, maxLength = 200): string | null {
  if (!value) return null;
  return value.trim().slice(0, maxLength);
}

export function isPositiveInt(value: unknown): boolean {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}
