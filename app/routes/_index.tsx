import { Link, redirect } from 'react-router';
import type { Route } from './+types/_index';
import { auth } from '~/lib/auth/auth.server';
import { Bookmarks, MagnifyingGlass, Tag, Star, Globe, Lightning } from '@phosphor-icons/react';

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  // If user is already logged in, redirect to bookmarks
  if (session) {
    throw redirect('/bookmarks');
  }

  return null;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Nookmark" className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Nookmark</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                登录
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                免费注册
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            优雅的书签管理工具
            <br />
            <span className="text-blue-600 dark:text-blue-500">让收藏更有价值</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            Nookmark 帮助你更好地组织和管理网页收藏，让重要的内容触手可及。支持标签分类、全文搜索、收藏星标等强大功能。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              免费开始使用
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3 text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg transition-all"
            >
              已有账号？登录
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-white dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            为什么选择 Nookmark？
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-16 max-w-2xl mx-auto">
            我们提供简洁而强大的功能，让你的书签管理更加高效
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg bg-white dark:bg-gray-800">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Bookmarks className="w-6 h-6 text-blue-600 dark:text-blue-500" weight="duotone" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                智能收藏
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                一键保存网页，自动提取标题、描述和图标，让你的收藏更加完整
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg bg-white dark:bg-gray-800">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <Tag className="w-6 h-6 text-purple-600 dark:text-purple-500" weight="duotone" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                标签分类
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                使用标签灵活组织书签，支持多标签，让分类更加精确
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg bg-white dark:bg-gray-800">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <MagnifyingGlass className="w-6 h-6 text-green-600 dark:text-green-500" weight="duotone" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                全文搜索
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                快速搜索标题、描述和 URL，即时找到你需要的书签
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg bg-white dark:bg-gray-800">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-500" weight="duotone" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                收藏星标
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                为重要书签添加星标，快速访问常用内容
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg bg-white dark:bg-gray-800">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-red-600 dark:text-red-500" weight="duotone" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                多端同步
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                云端存储，随时随地访问你的书签，支持 Web 和浏览器扩展
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg bg-white dark:bg-gray-800">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                <Lightning className="w-6 h-6 text-indigo-600 dark:text-indigo-500" weight="duotone" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                快速高效
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                简洁的界面设计，流畅的操作体验，让书签管理更加轻松
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            准备好开始了吗？
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            立即注册，免费使用 Nookmark 管理你的网页收藏
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            免费注册
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Nookmark" className="w-6 h-6" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                © 2024 Nookmark. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                登录
              </Link>
              <Link to="/signup" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                注册
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
