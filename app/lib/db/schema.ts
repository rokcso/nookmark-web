import { pgTable, uuid, text, timestamp, boolean, uniqueIndex } from 'drizzle-orm/pg-core';

// Better Auth tables - using Better Auth's recommended schema
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
});

// Bookmarks table - Full featured version
export const bookmark = pgTable('bookmark', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  favicon: text('favicon'),
  starred: boolean('starred').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  archivedAt: timestamp('archivedAt'),
  deletedAt: timestamp('deletedAt'),
}, (table) => ({
  // Composite unique index: same user cannot add same URL twice
  userUrlIdx: uniqueIndex('bookmark_user_url_idx').on(table.userId, table.url),
  // Index for efficient querying of non-deleted bookmarks
  deletedCreatedIdx: uniqueIndex('bookmark_deleted_created_idx').on(table.deletedAt, table.createdAt),
}));

// Tags table
export const tag = pgTable('tag', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  color: text('color'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => ({
  // Unique tag name per user
  userTagIdx: uniqueIndex('tag_user_name_idx').on(table.userId, table.name),
}));

// Bookmark-Tag association table (many-to-many)
export const bookmarkTag = pgTable('bookmark_tag', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookmarkId: uuid('bookmarkId')
    .notNull()
    .references(() => bookmark.id, { onDelete: 'cascade' }),
  tagId: uuid('tagId')
    .notNull()
    .references(() => tag.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => ({
  // Composite unique index: same bookmark-tag pair only once
  bookmarkTagIdx: uniqueIndex('bookmark_tag_idx').on(table.bookmarkId, table.tagId),
}));

// Legacy exports for backwards compatibility
export const users = user;
export const sessions = session;
export const accounts = account;
export const verifications = verification;
export const bookmarks = bookmark;
export const tags = tag;
export const bookmarkTags = bookmarkTag;
