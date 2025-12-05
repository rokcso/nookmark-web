import { db } from './db';
import { bookmark, tag, bookmarkTag } from './db/schema';
import { eq, and, isNull, like, or, desc, asc, sql, inArray } from 'drizzle-orm';
import { PAGINATION } from './constants';

export interface CreateBookmarkData {
  userId: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  starred?: boolean;
  tags?: string[];
}

export interface UpdateBookmarkData {
  title?: string;
  description?: string;
  starred?: boolean;
  tags?: string[];
}

export interface BookmarkFilters {
  search?: string;
  starred?: boolean;
  tags?: string[];
  archived?: boolean;
}

export interface BookmarkListOptions {
  userId: string;
  filters?: BookmarkFilters;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// Create a new bookmark
export async function createBookmark(data: CreateBookmarkData) {
  // Check if bookmark already exists for this user
  const existing = await db
    .select()
    .from(bookmark)
    .where(
      and(
        eq(bookmark.userId, data.userId),
        eq(bookmark.url, data.url),
        isNull(bookmark.deletedAt)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error('Bookmark already exists');
  }

  // Create bookmark
  const [newBookmark] = await db
    .insert(bookmark)
    .values({
      userId: data.userId,
      url: data.url,
      title: data.title,
      description: data.description,
      favicon: data.favicon,
      starred: data.starred ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Add tags if provided
  if (data.tags && data.tags.length > 0) {
    await addTagsToBookmarkSimple(newBookmark.id, data.userId, data.tags);
  }

  return newBookmark;
}

// Optimized batch function to add tags to bookmark (fixes N+1 query problem)
async function addTagsToBookmarkSimple(
  bookmarkId: string,
  userId: string,
  tagNames: string[]
) {
  if (tagNames.length === 0) return;

  // Step 1: Batch query all existing tags in a single database call
  const existingTags = await db
    .select()
    .from(tag)
    .where(and(eq(tag.userId, userId), inArray(tag.name, tagNames)));

  const existingTagNames = new Set(existingTags.map((t) => t.name));
  const existingTagIds = existingTags.map((t) => t.id);

  // Step 2: Identify tags that need to be created
  const newTagNames = tagNames.filter((name) => !existingTagNames.has(name));

  // Step 3: Batch insert new tags if any
  let newTagIds: string[] = [];
  if (newTagNames.length > 0) {
    const insertedTags = await db
      .insert(tag)
      .values(
        newTagNames.map((name) => ({
          userId,
          name,
          createdAt: new Date(),
        }))
      )
      .returning();
    newTagIds = insertedTags.map((t) => t.id);
  }

  // Step 4: Batch insert all bookmark-tag associations
  const allTagIds = [...existingTagIds, ...newTagIds];
  if (allTagIds.length > 0) {
    await db.insert(bookmarkTag).values(
      allTagIds.map((tagId) => ({
        bookmarkId,
        tagId,
        createdAt: new Date(),
      }))
    );
  }
}

// Get bookmarks with filters and pagination
export async function getBookmarks(options: BookmarkListOptions) {
  const {
    userId,
    filters = {},
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  } = options;

  // Build where conditions
  const conditions = [
    eq(bookmark.userId, userId),
    isNull(bookmark.deletedAt), // Only non-deleted bookmarks
  ];

  // Filter by archived status
  if (filters.archived !== undefined) {
    if (filters.archived) {
      conditions.push(sql`${bookmark.archivedAt} IS NOT NULL`);
    } else {
      conditions.push(isNull(bookmark.archivedAt));
    }
  }

  // Filter by starred
  if (filters.starred) {
    conditions.push(eq(bookmark.starred, true));
  }

  // Search filter
  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(bookmark.title, searchTerm),
        like(bookmark.description, searchTerm),
        like(bookmark.url, searchTerm)
      )!
    );
  }

  // Build sort order
  const sortColumn = bookmark[sortBy];
  const orderFn = sortOrder === 'asc' ? asc : desc;

  // Build query with tag filter if specified
  let query = db
    .select({
      bookmark,
      tags: sql<string[]>`
        COALESCE(
          array_agg(${tag.name}) FILTER (WHERE ${tag.name} IS NOT NULL),
          '{}'
        )
      `.as('tags'),
    })
    .from(bookmark)
    .leftJoin(bookmarkTag, eq(bookmark.id, bookmarkTag.bookmarkId))
    .leftJoin(tag, eq(bookmarkTag.tagId, tag.id))
    .where(and(...conditions))
    .groupBy(bookmark.id);

  // Add tag filter using HAVING clause
  if (filters.tags && filters.tags.length > 0) {
    query = query.having(
      sql`array_agg(${tag.name}) @> ARRAY[${sql.raw(filters.tags.map(t => `'${t}'`).join(','))}]::text[]`
    ) as typeof query;
  }

  const bookmarks = await query
    .orderBy(orderFn(sortColumn))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // Get total count with tag filter
  let countQuery = db
    .select({ count: sql<number>`count(DISTINCT ${bookmark.id})` })
    .from(bookmark)
    .leftJoin(bookmarkTag, eq(bookmark.id, bookmarkTag.bookmarkId))
    .leftJoin(tag, eq(bookmarkTag.tagId, tag.id))
    .where(and(...conditions));

  if (filters.tags && filters.tags.length > 0) {
    countQuery = countQuery
      .groupBy(bookmark.id)
      .having(
        sql`array_agg(${tag.name}) @> ARRAY[${sql.raw(filters.tags.map(t => `'${t}'`).join(','))}]::text[]`
      ) as typeof countQuery;
  }

  const countResult = await countQuery;
  const totalCount = filters.tags && filters.tags.length > 0
    ? countResult.length
    : Number(countResult[0]?.count || 0);

  return {
    bookmarks,
    total: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// Get single bookmark by ID
export async function getBookmarkById(id: string, userId: string) {
  const [result] = await db
    .select({
      bookmark,
      tags: sql<string[]>`
        COALESCE(
          array_agg(${tag.name}) FILTER (WHERE ${tag.name} IS NOT NULL),
          '{}'
        )
      `.as('tags'),
    })
    .from(bookmark)
    .leftJoin(bookmarkTag, eq(bookmark.id, bookmarkTag.bookmarkId))
    .leftJoin(tag, eq(bookmarkTag.tagId, tag.id))
    .where(
      and(
        eq(bookmark.id, id),
        eq(bookmark.userId, userId),
        isNull(bookmark.deletedAt)
      )
    )
    .groupBy(bookmark.id)
    .limit(1);

  return result || null;
}

// Update bookmark
export async function updateBookmark(
  id: string,
  userId: string,
  data: UpdateBookmarkData
) {
  // Build type-safe update data
  const updateData: {
    title?: string;
    description?: string;
    starred?: boolean;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.starred !== undefined) updateData.starred = data.starred;

  const [updated] = await db
    .update(bookmark)
    .set(updateData)
    .where(
      and(
        eq(bookmark.id, id),
        eq(bookmark.userId, userId),
        isNull(bookmark.deletedAt)
      )
    )
    .returning();

  if (!updated) {
    throw new Error('Bookmark not found');
  }

  // Update tags if provided
  if (data.tags !== undefined) {
    // Remove all existing tags
    await db.delete(bookmarkTag).where(eq(bookmarkTag.bookmarkId, id));

    // Add new tags
    if (data.tags.length > 0) {
      await addTagsToBookmarkSimple(id, userId, data.tags);
    }
  }

  return updated;
}

// Toggle starred status
export async function toggleBookmarkStar(id: string, userId: string) {
  const [result] = await db
    .update(bookmark)
    .set({
      starred: sql`NOT ${bookmark.starred}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bookmark.id, id),
        eq(bookmark.userId, userId),
        isNull(bookmark.deletedAt)
      )
    )
    .returning();

  return result;
}

// Soft delete bookmark
export async function deleteBookmark(id: string, userId: string) {
  const [result] = await db
    .update(bookmark)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bookmark.id, id),
        eq(bookmark.userId, userId),
        isNull(bookmark.deletedAt)
      )
    )
    .returning();

  return result;
}

// Archive/unarchive bookmark
export async function toggleBookmarkArchive(id: string, userId: string) {
  const [current] = await db
    .select()
    .from(bookmark)
    .where(
      and(
        eq(bookmark.id, id),
        eq(bookmark.userId, userId),
        isNull(bookmark.deletedAt)
      )
    )
    .limit(1);

  if (!current) {
    throw new Error('Bookmark not found');
  }

  const [result] = await db
    .update(bookmark)
    .set({
      archivedAt: current.archivedAt ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookmark.id, id))
    .returning();

  return result;
}

// Get all tags for a user
export async function getUserTags(userId: string) {
  const tags = await db
    .select({
      tag,
      count: sql<number>`COUNT(${bookmarkTag.bookmarkId})`.as('count'),
    })
    .from(tag)
    .leftJoin(bookmarkTag, eq(tag.id, bookmarkTag.tagId))
    .where(eq(tag.userId, userId))
    .groupBy(tag.id)
    .orderBy(desc(sql`COUNT(${bookmarkTag.bookmarkId})`));

  return tags;
}

// Batch delete bookmarks
export async function batchDeleteBookmarks(ids: string[], userId: string) {
  const result = await db
    .update(bookmark)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        inArray(bookmark.id, ids),
        eq(bookmark.userId, userId),
        isNull(bookmark.deletedAt)
      )
    )
    .returning();

  return result;
}
