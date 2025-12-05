import { type MetaFunction, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { useLoaderData, useSubmit, useNavigation, useNavigate, useSearchParams, Form, Link } from 'react-router';
import { useState } from 'react';
import { requireAuth } from '~/lib/auth/require-auth';
import { signOut } from '~/lib/auth/auth.client';
import { getBookmarks, getUserTags, createBookmark, deleteBookmark, toggleBookmarkStar, updateBookmark } from '~/lib/bookmarks.server';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { Card, CardContent } from '~/components/ui/card';
import { BookmarkSimple, SignOut, MagnifyingGlass, Plus, Star, Trash, Tag as TagIcon, Gear } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Session } from '~/lib/auth/auth.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Nookmark - Bookmark Management' },
    { name: 'description', content: 'Smart Bookmark Management System' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireAuth(request);

  const url = new URL(request.url);
  const search = url.searchParams.get('search') || undefined;
  const starred = url.searchParams.get('starred') === 'true' || undefined;
  const tagFilter = url.searchParams.get('tag') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1');

  const [bookmarksData, tagsData] = await Promise.all([
    getBookmarks({
      userId: session.user.id,
      filters: {
        search,
        starred,
        tags: tagFilter ? [tagFilter] : undefined,
      },
      page,
      pageSize: 50,
    }),
    getUserTags(session.user.id),
  ]);

  return { session, bookmarksData, tagsData, activeTag: tagFilter };
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'create') {
      const url = formData.get('url') as string;
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const tags = formData.get('tags') as string;

      await createBookmark({
        userId: session.user.id,
        url,
        title,
        description: description || undefined,
        tags: tags ? tags.split(/\s+/).map(t => t.trim()).filter(Boolean) : [],
      });

      return { success: true, message: 'Bookmark added successfully' };
    }

    if (intent === 'delete') {
      const bookmarkId = formData.get('bookmarkId') as string;
      await deleteBookmark(bookmarkId, session.user.id);
      return { success: true, message: 'Bookmark deleted' };
    }

    if (intent === 'toggleStar') {
      const bookmarkId = formData.get('bookmarkId') as string;
      await toggleBookmarkStar(bookmarkId, session.user.id);
      return { success: true };
    }

    if (intent === 'update') {
      const bookmarkId = formData.get('bookmarkId') as string;
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const tags = formData.get('tags') as string;

      await updateBookmark(bookmarkId, session.user.id, {
        title,
        description: description || undefined,
        tags: tags ? tags.split(/\s+/).map(t => t.trim()).filter(Boolean) : [],
      });

      return { success: true, message: 'Bookmark updated successfully' };
    }

    return { success: false, message: 'Unknown action' };
  } catch (error) {
    console.error('Action error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Action failed' };
  }
}

export default function Index() {
  const { session, bookmarksData, tagsData, activeTag } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === 'submitting';

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newBookmark, setNewBookmark] = useState({
    url: '',
    title: '',
    description: '',
    tags: '',
  });
  const [editingBookmark, setEditingBookmark] = useState<{
    id: string;
    url: string;
    title: string;
    description: string;
    tags: string;
  } | null>(null);

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/login';
        },
      },
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    submit(form);
  };

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('intent', 'create');
    formData.append('url', newBookmark.url);
    formData.append('title', newBookmark.title);
    formData.append('description', newBookmark.description);
    formData.append('tags', newBookmark.tags);

    submit(formData, { method: 'post' });
    setIsAddDialogOpen(false);
    setNewBookmark({ url: '', title: '', description: '', tags: '' });
    toast.success('Bookmark added successfully');
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) return;

    const formData = new FormData();
    formData.append('intent', 'delete');
    formData.append('bookmarkId', bookmarkId);
    submit(formData, { method: 'post' });
    toast.success('Bookmark deleted');
  };

  const handleToggleStar = (bookmarkId: string) => {
    const formData = new FormData();
    formData.append('intent', 'toggleStar');
    formData.append('bookmarkId', bookmarkId);
    submit(formData, { method: 'post' });
  };

  const handleEditClick = (bookmark: any) => {
    setEditingBookmark({
      id: bookmark.bookmark.id,
      url: bookmark.bookmark.url,
      title: bookmark.bookmark.title,
      description: bookmark.bookmark.description || '',
      tags: bookmark.tags.join(' '),
    });
    setIsEditDialogOpen(true);
  };

  const handleEditBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBookmark) return;

    const formData = new FormData();
    formData.append('intent', 'update');
    formData.append('bookmarkId', editingBookmark.id);
    formData.append('title', editingBookmark.title);
    formData.append('description', editingBookmark.description);
    formData.append('tags', editingBookmark.tags);

    submit(formData, { method: 'post' });
    setIsEditDialogOpen(false);
    setEditingBookmark(null);
    toast.success('Bookmark updated successfully');
  };

  const handleTagClick = (tagName: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tag', tagName);
    navigate(`/bookmarks?${params.toString()}`);
  };

  const handleClearFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('tag');
    navigate(`/bookmarks?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/bookmarks" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="Nookmark" className="w-8 h-8" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Nookmark</h1>
            </Link>
            <div className="flex items-center gap-2">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white text-sm rounded-md transition-colors flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" weight="bold" />
                    Add Bookmark
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Add Bookmark</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddBookmark} className="space-y-5 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="url" className="text-sm font-normal text-gray-700 dark:text-gray-300">URL</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://example.com"
                        value={newBookmark.url}
                        onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                        required
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-normal text-gray-700 dark:text-gray-300">Title</Label>
                      <Input
                        id="title"
                        type="text"
                        placeholder="Bookmark Title"
                        value={newBookmark.title}
                        onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                        required
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags" className="text-sm font-normal text-gray-700 dark:text-gray-300">Tags</Label>
                      <Input
                        id="tags"
                        type="text"
                        placeholder="Type tags (space to separate)"
                        value={newBookmark.tags}
                        onChange={(e) => setNewBookmark({ ...newBookmark, tags: e.target.value })}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Press space to add tags</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-normal text-gray-700 dark:text-gray-300">
                        Description <span className="text-gray-500 dark:text-gray-400">(Optional)</span>
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Add a description for this bookmark..."
                        value={newBookmark.description}
                        onChange={(e) => setNewBookmark({ ...newBookmark, description: e.target.value })}
                        className="text-sm min-h-[100px] resize-none"
                        rows={4}
                      />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                        className="text-sm"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="text-sm bg-blue-600 hover:bg-blue-700">
                        {isSubmitting ? 'Adding...' : 'Add Bookmark'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white text-sm rounded-md transition-colors flex items-center gap-1.5">
                <Gear className="w-3.5 h-3.5" weight="bold" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Edit Bookmark Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Bookmark</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditBookmark} className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-url" className="text-sm font-normal text-gray-700 dark:text-gray-300">URL</Label>
              <Input
                id="edit-url"
                type="url"
                value={editingBookmark?.url || ''}
                disabled
                className="text-sm bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-sm font-normal text-gray-700 dark:text-gray-300">Title</Label>
              <Input
                id="edit-title"
                type="text"
                placeholder="Bookmark Title"
                value={editingBookmark?.title || ''}
                onChange={(e) => setEditingBookmark(editingBookmark ? { ...editingBookmark, title: e.target.value } : null)}
                required
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags" className="text-sm font-normal text-gray-700 dark:text-gray-300">Tags</Label>
              <Input
                id="edit-tags"
                type="text"
                placeholder="Type tags (space to separate)"
                value={editingBookmark?.tags || ''}
                onChange={(e) => setEditingBookmark(editingBookmark ? { ...editingBookmark, tags: e.target.value } : null)}
                className="text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Press space to add tags</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-normal text-gray-700 dark:text-gray-300">
                Description <span className="text-gray-500 dark:text-gray-400">(Optional)</span>
              </Label>
              <Textarea
                id="edit-description"
                placeholder="Add a description for this bookmark..."
                value={editingBookmark?.description || ''}
                onChange={(e) => setEditingBookmark(editingBookmark ? { ...editingBookmark, description: e.target.value } : null)}
                className="text-sm min-h-[100px] resize-none"
                rows={4}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="text-sm"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="text-sm bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Search and Filter Bar */}
      <div className="max-w-5xl mx-auto px-6 py-4">
        <Form method="get" onSubmit={handleSearch} className="flex items-center gap-2">
          {activeTag && <input type="hidden" name="tag" value={activeTag} />}
          <div className="flex-1 relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" weight="bold" />
            <Input
              type="search"
              name="search"
              placeholder="Search bookmarks (title, description, URL)..."
              className="pl-9 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              defaultValue={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" size="sm" className="text-sm">
            Search
          </Button>
        </Form>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bookmarks List - 2/3 width */}
          <div className="lg:col-span-2 space-y-4">
            {/* Sort and Stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">{bookmarksData.total}</span> bookmarks
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <span className="text-xs">Sort by:</span>
                <select className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1">
                  <option>Created Time ↓</option>
                  <option>Updated Time ↓</option>
                  <option>Title A-Z</option>
                </select>
              </div>
            </div>

            {/* Active Filter */}
            {activeTag && (
              <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                <TagIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" weight="bold" />
                <span className="text-blue-700 dark:text-blue-300">
                  Filtered by tag: <span className="font-semibold">{activeTag}</span>
                </span>
                <button
                  onClick={handleClearFilter}
                  className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* Bookmarks List */}
            {bookmarksData.bookmarks.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                <BookmarkSimple className="mx-auto w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" weight="light" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm ? 'No matching bookmarks found' : 'No bookmarks yet. Start adding!'}
                </p>
                <button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" weight="bold" />
                  Add your first bookmark
                </button>
              </div>
            ) : (
              <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
                {bookmarksData.bookmarks.map((item) => (
                  <div
                    key={item.bookmark.id}
                    className="py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Favicon */}
                      {item.bookmark.favicon && (
                        <img
                          src={item.bookmark.favicon}
                          alt=""
                          className="w-4 h-4 mt-1 flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h3 className="font-normal text-gray-900 dark:text-white text-base leading-tight mb-1 flex items-center gap-1.5">
                          {item.bookmark.title}
                          {item.bookmark.starred && (
                            <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" weight="fill" />
                          )}
                        </h3>

                        {/* URL */}
                        <a
                          href={item.bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 block mb-1.5 truncate"
                        >
                          {item.bookmark.url}
                        </a>

                        {/* Description */}
                        {item.bookmark.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 line-clamp-2">
                            {item.bookmark.description}
                          </p>
                        )}

                        {/* Meta info and actions */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{new Date(item.bookmark.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span>•</span>
                          <button
                            onClick={() => handleEditClick(item)}
                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            Edit
                          </button>
                          <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Archive</button>
                          <button
                            onClick={() => handleDeleteBookmark(item.bookmark.id)}
                            className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {bookmarksData.totalPages > 1 && (
              <div className="flex justify-center gap-1 pt-4">
                {Array.from({ length: Math.min(bookmarksData.totalPages, 7) }, (_, i) => i + 1).map((page) => (
                  <Form key={page} method="get" className="inline">
                    <input type="hidden" name="search" value={searchTerm} />
                    {activeTag && <input type="hidden" name="tag" value={activeTag} />}
                    <input type="hidden" name="page" value={page} />
                    <button
                      type="submit"
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        page === bookmarksData.page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  </Form>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Tags - 1/3 width */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sticky top-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <TagIcon className="w-4 h-4" weight="bold" />
                  Tags
                </h3>
                {activeTag && (
                  <button
                    onClick={handleClearFilter}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              {tagsData.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">No tags yet</p>
              ) : (
                <div className="space-y-1.5">
                  {tagsData.slice(0, 20).map((item) => {
                    const isActive = activeTag === item.tag.name;
                    return (
                      <button
                        key={item.tag.id}
                        onClick={() => handleTagClick(item.tag.name)}
                        className={`w-full flex items-center justify-between text-sm px-2 py-1.5 rounded transition-colors text-left group ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="truncate text-xs">
                          {item.tag.name}
                        </span>
                        <span className={`text-xs ml-2 flex-shrink-0 ${
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* User Info Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Current User</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-3 truncate">
                {session.user.name || session.user.email}
              </div>
              <button
                onClick={handleSignOut}
                className="w-full px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <SignOut className="w-3.5 h-3.5" weight="bold" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
