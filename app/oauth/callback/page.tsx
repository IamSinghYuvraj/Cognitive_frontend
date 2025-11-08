'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      // Extract tokens from URL query parameters
      const accessToken = searchParams?.get('access_token');
      const refreshToken = searchParams?.get('refresh_token');
      
      if (accessToken && refreshToken) {
        try {
          // Use the login function from AuthContext
          // This will handle storing tokens and fetching user data
          await login(accessToken, refreshToken);
          
          // Redirect to dashboard after successful login
          router.push('/');
        } catch (error) {
          console.error('Error during OAuth callback:', error);
          setError('Authentication failed. Please try again.');
          // Redirect to login page after a delay
          setTimeout(() => {
            router.push('/login?error=oauth_failed');
          }, 2000);
        }
      } else {
        setError('Missing authentication tokens. Please try again.');
        // Redirect to login page after a delay
        setTimeout(() => {
          router.push('/login?error=missing_tokens');
        }, 2000);
      }
    };
    
    handleAuth();
  }, [router, searchParams, login]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 relative">
      {/* Background Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative bg-background/95 backdrop-blur-sm border border-border/40 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse pointer-events-none" />
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              {error ? 'Authentication Error' : 'Completing authentication...'}
            </h2>
            {error ? (
              <p className="text-red-600 dark:text-red-400">{error}</p>
            ) : (
              <p className="text-muted-foreground">Please wait while we log you in.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
