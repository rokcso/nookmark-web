import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse tag string into array of clean tag names
 * Splits by whitespace, trims each tag, and filters out empty values
 *
 * @param tagString - Space-separated tag string (e.g., "react typescript nodejs")
 * @returns Array of cleaned tag names
 *
 * @example
 * parseTags("react  typescript   nodejs") // ["react", "typescript", "nodejs"]
 * parseTags("") // []
 * parseTags(null) // []
 */
export function parseTags(tagString: string | null | undefined): string[] {
  if (!tagString) return [];

  return tagString
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}
