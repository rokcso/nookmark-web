import { type MetaFunction, type LoaderFunctionArgs, redirect } from 'react-router';
import { useLoaderData } from 'react-router';
import { requireAuth } from '~/lib/auth/require-auth';
import { signOut } from '~/lib/auth/auth.client';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { SignOut, BookmarkSimple } from '@phosphor-icons/react';
import type { Session } from '~/lib/auth/auth.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Nookmark - 书签管理' },
    { name: 'description', content: '智能书签管理系统' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireAuth(request);
  return { session };
}

export default function Index() {
  const { session } = useLoaderData<{ session: Session }>();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/login';
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookmarkSimple className="h-6 w-6" weight="fill" />
            <h1 className="text-xl font-bold">Nookmark</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {session.user.name || session.user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <SignOut className="mr-2 h-4 w-4" weight="bold" />
              退出登录
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>欢迎使用 Nookmark!</CardTitle>
            <CardDescription>
              你的智能书签管理系统已准备就绪
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                这是 Nookmark 的主页面。书签功能正在开发中...
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>当前用户：</span>
                <span className="font-medium">{session.user.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
