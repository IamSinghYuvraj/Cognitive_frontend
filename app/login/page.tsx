'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader as Loader2, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth-store';
import { authAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authAPI.login(formData.email, formData.password);
  // Log backend response body for verification
  console.log('Login successful:', response.data);

  const { access_token, user, refresh_token } = response.data;

  setAuth(access_token, user, refresh_token);
      console.log('Token stored via setAuth:', access_token);
      toast({
        title: 'Success',
        description: 'Logged in successfully!',
      });
      router.push('/');
    } catch (error: any) {
      // Log the raw error to console for debugging
      console.error('Login failed:', error?.response?.data ?? error?.message ?? error);

      // Extract a user-friendly message
      const respData = error?.response?.data;
      let description = 'Login failed. Please try again.';

      if (respData) {
        // Backend may return { success: false, error: '...' } or { detail: '...' }
        if (typeof respData === 'string') {
          description = respData;
        } else if (typeof respData === 'object') {
          description = respData.error ?? respData.detail ?? respData.message ?? description;
        }
      } else if (error?.response?.status === 400 || error?.response?.status === 401) {
        description = 'Invalid email or password.';
      } else if (error?.message) {
        description = error.message;
      }

      // Ensure we render only strings in UI
      toast({
        title: 'Error',
        description: String(description),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Brain className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl">Welcome to Cognitive</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don&apos;t have an account? </span>
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}