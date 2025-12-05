import { type MetaFunction, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { useLoaderData, useSubmit, useNavigation, Form } from 'react-router';
import { useState } from 'react';
import { requireAuth } from '~/lib/auth/require-auth';
import { signOut } from '~/lib/auth/auth.client';
import { getBookmarks, getUserTags, createBookmark, deleteBookmark, toggleBookmarkStar } from '~/lib/bookmarks.server';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { Card, CardContent } from '~/components/ui/card';
import { BookmarkSimple, SignOut, MagnifyingGlass, Plus, Star, Trash, Tag as TagIcon, Gear } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Session } from '~/lib/auth/auth.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Nookmark - 书签管理' },
    { name: 'description', content: '智能书签管理系统' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireAuth(request);

  const url = new URL(request.url);
  const search = url.searchParams.get('search') || undefined;
  const starred = url.searchParams.get('starred') === 'true' || undefined;
  const page = parseInt(url.searchParams.get('page') || '1');

  const [bookmarksData, tagsData] = await Promise.all([
    getBookmarks({
      userId: session.user.id,
      filters: { search, starred },
      page,
      pageSize: 50,
    }),
    getUserTags(session.user.id),
  ]);

  return { session, bookmarksData, tagsData };
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
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });

      return { success: true, message: '书签添加成功' };
    }

    if (intent === 'delete') {
      const bookmarkId = formData.get('bookmarkId') as string;
      await deleteBookmark(bookmarkId, session.user.id);
      return { success: true, message: '书签已删除' };
    }

    if (intent === 'toggleStar') {
      const bookmarkId = formData.get('bookmarkId') as string;
      await toggleBookmarkStar(bookmarkId, session.user.id);
      return { success: true };
    }

    return { success: false, message: '未知操作' };
  } catch (error) {
    console.error('Action error:', error);
    return { success: false, message: error instanceof Error ? error.message : '操作失败' };
  }
}

export default function Index() {
  const { session, bookmarksData, tagsData } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBookmark, setNewBookmark] = useState({
    url: '',
    title: '',
    description: '',
    tags: '',
  });

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
    toast.success('书签添加成功');
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    if (!confirm('确定要删除这个书签吗？')) return;

    const formData = new FormData();
    formData.append('intent', 'delete');
    formData.append('bookmarkId', bookmarkId);
    submit(formData, { method: 'post' });
    toast.success('书签已删除');
  };

  const handleToggleStar = (bookmarkId: string) => {
    const formData = new FormData();
    formData.append('intent', 'toggleStar');
    formData.append('bookmarkId', bookmarkId);
    submit(formData, { method: 'post' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
              <BookmarkSimple className="w-7 h-7 text-blue-600 dark:text-blue-400" weight="fill" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Nookmark</h1>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white text-sm rounded-md transition-colors flex items-center gap-1.5">
                    <Plus className="w-4 h-4" weight="bold" />
                    添加书签
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>添加新书签</DialogTitle>
                    <DialogDescription>
                      添加一个新的书签到你的收藏
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddBookmark} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="url" className="text-sm font-medium">URL *</Label>
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
                      <Label htmlFor="title" className="text-sm font-medium">标题 *</Label>
                      <Input
                        id="title"
                        type="text"
                        placeholder="书签标题"
                        value={newBookmark.title}
                        onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                        required
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">描述</Label>
                      <Input
                        id="description"
                        type="text"
                        placeholder="书签描述（可选）"
                        value={newBookmark.description}
                        onChange={(e) => setNewBookmark({ ...newBookmark, description: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags" className="text-sm font-medium">标签</Label>
                      <Input
                        id="tags"
                        type="text"
                        placeholder="标签1, 标签2, 标签3"
                        value={newBookmark.tags}
                        onChange={(e) => setNewBookmark({ ...newBookmark, tags: e.target.value })}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">用逗号分隔多个标签</p>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700">
                        {isSubmitting ? '添加中...' : '添加书签'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white text-sm rounded-md transition-colors flex items-center gap-1.5">
                <Gear className="w-4 h-4" weight="bold" />
                设置
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filter Bar */}
      <div className="max-w-5xl mx-auto px-6 py-4">
        <Form method="get" onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" weight="bold" />
            <Input
              type="search"
              name="search"
              placeholder="搜索书签（标题、描述、URL）..."
              className="pl-9 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              defaultValue={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" size="sm" className="text-sm">
            搜索
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
                共 <span className="font-semibold text-gray-900 dark:text-white">{bookmarksData.total}</span> 个书签
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <span className="text-xs">排序：</span>
                <select className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1">
                  <option>创建时间 ↓</option>
                  <option>更新时间 ↓</option>
                  <option>标题 A-Z</option>
                </select>
              </div>
            </div>

            {/* Bookmarks List */}
            {bookmarksData.bookmarks.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                <BookmarkSimple className="mx-auto w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" weight="light" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm ? '没有找到匹配的书签' : '还没有书签，开始添加吧！'}
                </p>
                <button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" weight="bold" />
                  添加第一个书签
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {bookmarksData.bookmarks.map((item) => (
                  <div
                    key={item.bookmark.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Favicon */}
                      {item.bookmark.favicon && (
                        <img
                          src={item.bookmark.favicon}
                          alt=""
                          className="w-4 h-4 mt-0.5 flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title and Star */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-snug">
                            {item.bookmark.title}
                            {item.bookmark.starred && (
                              <Star className="inline-block ml-1.5 w-3.5 h-3.5 text-yellow-500" weight="fill" />
                            )}
                          </h3>
                        </div>

                        {/* URL */}
                        <a
                          href={item.bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline block mb-2 truncate"
                        >
                          {item.bookmark.url}
                        </a>

                        {/* Description */}
                        {item.bookmark.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 leading-relaxed">
                            {item.bookmark.description}
                          </p>
                        )}

                        {/* Tags */}
                        {item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                              >
                                <TagIcon className="w-3 h-3" weight="bold" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleStar(item.bookmark.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title={item.bookmark.starred ? '取消收藏' : '收藏'}
                        >
                          <Star
                            className="w-4 h-4 text-gray-600 dark:text-gray-400"
                            weight={item.bookmark.starred ? 'fill' : 'regular'}
                          />
                        </button>
                        <button
                          onClick={() => handleDeleteBookmark(item.bookmark.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="删除"
                        >
                          <Trash className="w-4 h-4 text-gray-600 dark:text-gray-400" weight="bold" />
                        </button>
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
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <TagIcon className="w-4 h-4" weight="bold" />
                标签云
              </h3>
              {tagsData.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">还没有标签</p>
              ) : (
                <div className="space-y-1.5">
                  {tagsData.slice(0, 20).map((item) => (
                    <button
                      key={item.tag.id}
                      className="w-full flex items-center justify-between text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 px-2 py-1.5 rounded transition-colors text-left group"
                    >
                      <span className="text-gray-700 dark:text-gray-300 truncate text-xs">
                        {item.tag.name}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 text-xs ml-2 flex-shrink-0">
                        {item.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Info Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">当前用户</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-3 truncate">
                {session.user.name || session.user.email}
              </div>
              <button
                onClick={handleSignOut}
                className="w-full px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <SignOut className="w-3.5 h-3.5" weight="bold" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
