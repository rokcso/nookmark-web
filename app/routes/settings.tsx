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
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/bookmarks"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" weight="bold" />
              <span className="text-sm">Back to Bookmarks</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

        <div className="space-y-6">
          {/* User Info Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600 dark:text-blue-400" weight="bold" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Account</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{session.user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{session.user.email}</p>
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
            </CardContent>
          </Card>

          {/* Theme Section */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose how Nookmark looks to you. Select a single theme, or sync with your system.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {/* Light Theme */}
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === 'light'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      theme === 'light'
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Sun className={`w-5 h-5 ${
                        theme === 'light'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`} weight="bold" />
                    </div>
                    <span className={`text-sm font-medium ${
                      theme === 'light'
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      Light
                    </span>
                  </div>
                </button>

                {/* Dark Theme */}
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      theme === 'dark'
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Moon className={`w-5 h-5 ${
                        theme === 'dark'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`} weight="bold" />
                    </div>
                    <span className={`text-sm font-medium ${
                      theme === 'dark'
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      Dark
                    </span>
                  </div>
                </button>

                {/* Auto Theme */}
                <button
                  onClick={() => handleThemeChange('auto')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === 'auto'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      theme === 'auto'
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Desktop className={`w-5 h-5 ${
                        theme === 'auto'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`} weight="bold" />
                    </div>
                    <span className={`text-sm font-medium ${
                      theme === 'auto'
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      Auto
                    </span>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
