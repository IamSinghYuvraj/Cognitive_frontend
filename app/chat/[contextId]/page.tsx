'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ChatInterface } from '@/components/ChatInterface';
import { contextAPI } from '@/lib/api';
import { Context } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const contextId = Array.isArray(params?.contextId) ? params?.contextId[0] : (params?.contextId as string);
  const [context, setContext] = useState<Context | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      if (!contextId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        console.log('Loading context:', contextId);
        const contextData = await contextAPI.getContext(contextId);
        console.log('Context loaded:', contextData);
        setContext(contextData);
      } catch (err: any) {
        console.error('Failed to load context:', err);
        setError(err.response?.data?.detail || err.message || 'Failed to load context');
        // Redirect to dashboard after a short delay if context not found
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };
    
    load();
  }, [contextId, router, isAuthenticated]);

  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-56px)]">
        {isLoading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading chat...</p>
            </div>
          </div>
        ) : error ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive mb-2">{error}</p>
              <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
            </div>
          </div>
        ) : context ? (
          <ChatInterface contextId={context.id} contextName={context.name} />
        ) : (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Context not found</p>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}


