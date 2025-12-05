import { type MetaFunction, type LoaderFunctionArgs, redirect } from 'react-router';
import { Link } from 'react-router';
import { useState } from 'react';
import { signIn } from '~/lib/auth/auth.client';
import { auth } from '~/lib/auth/auth.server';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { toast } from 'sonner';
import { GoogleLogo } from '@phosphor-icons/react';

export const meta: MetaFunction = () => {
  return [
    { title: '登录 - Nookmark' },
    { name: 'description', content: '登录到 Nookmark 书签管理系统' },
  ];
};

// Redirect to home if already logged in
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) {
    throw redirect('/');
  }
  return null;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn.email({
        email,
        password,
        callbackURL: '/',
      });
    } catch (error) {
      toast.error('登录失败，请检查邮箱和密码');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/',
      });
    } catch (error) {
      toast.error('Google 登录失败');
      console.error('Google login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">欢迎回来</CardTitle>
          <CardDescription className="text-center">
            登录到你的 Nookmark 账户
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google OAuth Login */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <GoogleLogo className="mr-2 h-4 w-4" weight="bold" />
            使用 Google 登录
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">或使用邮箱</span>
            </div>
          </div>

          {/* Email/Password Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            还没有账户？{' '}
            <Link to="/signup" className="text-primary hover:underline">
              立即注册
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
