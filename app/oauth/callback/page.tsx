'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/app-store';

export default function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAppStore();

  useEffect(() => {
    const accessToken = searchParams?.get('access_token');
    const refreshToken = searchParams?.get('refresh_token');
    
    if (accessToken && refreshToken) {
      // Store the tokens and redirect to home
      setAuth(accessToken, refreshToken, {});
      router.push('/');
    } else {
      // If no tokens, redirect to login
      router.push('/login');
    }
  }, [searchParams, setAuth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-medium">Completing sign in...</p>
        <p className="text-sm text-muted-foreground mt-2">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
