import { db } from './db';
import { bookmark, tag, bookmarkTag } from './db/schema';
import { eq, and, isNull, like, or, desc, asc, sql, inArray } from 'drizzle-orm';

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

// Helper function to add tags to bookmark (without transaction)
async function addTagsToBookmarkSimple(
  bookmarkId: string,
  userId: string,
  tagNames: string[]
) {
  for (const tagName of tagNames) {
    // Create tag if it doesn't exist
    const [existingTag] = await db
      .select()
      .from(tag)
      .where(and(eq(tag.userId, userId), eq(tag.name, tagName)))
      .limit(1);

    let tagId: string;
    if (existingTag) {
      tagId = existingTag.id;
    } else {
      const [newTag] = await db
        .insert(tag)
        .values({
          userId,
          name: tagName,
          createdAt: new Date(),
        })
        .returning();
      tagId = newTag.id;
    }

    // Create bookmark-tag association
    await db.insert(bookmarkTag).values({
      bookmarkId,
      tagId,
      createdAt: new Date(),
    });
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
    pageSize = 50,
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

  // Get bookmarks
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
    .groupBy(bookmark.id)
    .orderBy(orderFn(sortColumn))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const bookmarks = await query;

  // Filter by tags if specified
  let filteredBookmarks = bookmarks;
  if (filters.tags && filters.tags.length > 0) {
    filteredBookmarks = bookmarks.filter((b) =>
      filters.tags!.every((filterTag) => b.tags.includes(filterTag))
    );
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookmark)
    .where(and(...conditions));

  return {
    bookmarks: filteredBookmarks,
    total: Number(count),
    page,
    pageSize,
    totalPages: Math.ceil(Number(count) / pageSize),
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
  // Update bookmark fields
  const updateData: any = {
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
