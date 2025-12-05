// Application-wide constants and configuration values

// Pagination settings
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_VISIBLE_PAGES: 7,
} as const;

// Tag settings
export const TAGS = {
  MAX_SIDEBAR_DISPLAY: 20,
  MAX_TAG_LENGTH: 50,
  MAX_TAGS_PER_BOOKMARK: 20,
} as const;

// Bookmark settings
export const BOOKMARKS = {
  MAX_TITLE_LENGTH: 500,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_URL_LENGTH: 2048,
} as const;

// Search settings
export const SEARCH = {
  DEBOUNCE_DELAY_MS: 300,
  MIN_SEARCH_LENGTH: 2,
} as const;

// Session settings
export const SESSION = {
  COOKIE_MAX_AGE_DAYS: 30,
} as const;
