type ClassValue = string | false | null | undefined;

/** Join conditional class names — the tiny slice of `clsx` this app needs. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
