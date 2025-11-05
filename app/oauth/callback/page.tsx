'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    console.log('OAuth callback triggered');
    
    // Log all URL parameters for debugging
    console.log('URL Search Params:', Object.fromEntries(searchParams?.entries() || []));
    
    const accessToken = searchParams?.get('access_token');
    const refreshToken = searchParams?.get('refresh_token');
    
    console.log('Access token from URL:', accessToken ? '***token_present***' : 'MISSING');
    console.log('Refresh token from URL:', refreshToken ? '***token_present***' : 'MISSING');
    
    const handleAuth = async () => {
      if (accessToken && refreshToken) {
        try {
          console.log('Processing OAuth callback with tokens...');
          
          // Use the login function from AuthContext
          // This will handle saving tokens and fetching user data
          await login(accessToken, refreshToken);
          
          console.log('Authentication successful, redirecting to dashboard...');
          router.push('/');
        } catch (error) {
          console.error('Error during OAuth callback:', error);
          router.push('/login?error=oauth_failed');
        }
      } else {
        console.error('Missing tokens in OAuth callback');
        router.push('/login?error=missing_tokens');
      }
    };
    
    handleAuth();
  }, [router, searchParams, login]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <h2 className="text-2xl font-semibold">Completing authentication...</h2>
      <p className="text-muted-foreground">Please wait while we log you in.</p>
    </div>
  );
}
