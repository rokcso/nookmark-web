import { type MetaFunction, type LoaderFunctionArgs } from 'react-router';
import { Link, useLoaderData } from 'react-router';
import { requireAuth } from '~/lib/auth/require-auth';
import { signOut } from '~/lib/auth/auth.client';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { ArrowLeft, Moon, Sun, Desktop, User, SignOut } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Settings - Nookmark' },
    { name: 'description', content: 'Manage your Nookmark settings' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireAuth(request);
  return { session };
}

type Theme = 'light' | 'dark' | 'auto';

export default function Settings() {
  const { session } = useLoaderData<typeof loader>();
  const [theme, setTheme] = useState<Theme>('auto');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'auto';
    setTheme(savedTheme);

    // Apply theme immediately
    applyTheme(savedTheme);

    // Listen for system theme changes when in auto mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = localStorage.getItem('theme') as Theme;
      if (currentTheme === 'auto') {
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/';
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Nookmark" className="w-7 h-7" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Settings
              </h1>
            </div>
            <Link
              to="/bookmarks"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white text-sm rounded-md transition-colors"
            >
              ← Back to Bookmarks
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Appearance & Display Section */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Appearance & Display
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Customize how Nookmark looks and displays your bookmarks
            </p>
          </div>

          {/* Theme Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Theme Mode
            </h3>
            <div className="space-y-2">
              {/* Auto Theme */}
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  theme === 'auto'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 dark:border-blue-500 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value="auto"
                  checked={theme === 'auto'}
                  onChange={() => handleThemeChange('auto')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 dark:text-blue-500 dark:focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Auto
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Follow system theme
                  </p>
                </div>
                <Desktop
                  className={`w-5 h-5 ${theme === 'auto' ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400'}`}
                  weight="regular"
                />
              </label>

              {/* Light Theme */}
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  theme === 'light'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 dark:border-blue-500 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={theme === 'light'}
                  onChange={() => handleThemeChange('light')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 dark:text-blue-500 dark:focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Light
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Always use light theme
                  </p>
                </div>
                <Sun
                  className={`w-5 h-5 ${theme === 'light' ? 'text-amber-500' : 'text-gray-400'}`}
                  weight="regular"
                />
              </label>

              {/* Dark Theme */}
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  theme === 'dark'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 dark:border-blue-500 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={theme === 'dark'}
                  onChange={() => handleThemeChange('dark')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 dark:text-blue-500 dark:focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Dark
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Always use dark theme
                  </p>
                </div>
                <Moon
                  className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-500' : 'text-gray-400'}`}
                  weight="regular"
                />
              </label>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Account
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your account information and preferences
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" weight="bold" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <SignOut className="w-4 h-4" weight="bold" />
                Sign Out
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
