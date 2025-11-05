'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ChatInterface } from '@/components/ChatInterface';
import { contextAPI } from '@/lib/api';
import { Context } from '@/lib/types';
import { useAppStore } from '@/lib/app-store';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const contextId = Array.isArray(params?.contextId) ? params?.contextId[0] : (params?.contextId as string);
  const [context, setContext] = useState<Context | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const token = useAppStore((state) => state.token);

  useEffect(() => {
    const load = async () => {
      if (!contextId || !token) return;
      try {
        const contextData = await contextAPI.getContext(contextId, token);
        setContext(contextData);
      } catch (e) {
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [contextId, router, token]);

  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-56px)]">
        {isLoading || !context ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading chat...</p>
            </div>
          </div>
        ) : (
          <ChatInterface contextId={context.id} contextName={context.name} />
        )}
      </div>
    </ProtectedRoute>
  );
}


