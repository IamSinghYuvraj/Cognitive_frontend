// Store refresh callback - will be set by AuthContext
let refreshTokenCallback: (() => Promise<string | null>) | null = null;

// Export function to set refresh callback (called by AuthContext)
export const setChatStreamRefreshCallback = (callback: () => Promise<string | null>) => {
  refreshTokenCallback = callback;
};

/**
 * Get access token from localStorage (primary source of truth)
 */
function getAccessTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function buildSSEUrl(contextId: string, message: string, mode: string, token: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + `/api/chat/${contextId}`;
  const url = new URL(baseUrl);
  url.searchParams.set('message', message);
  url.searchParams.set('mode', mode);
  // Provide both keys for backend compatibility
  url.searchParams.set('token', token);
  url.searchParams.set('access_token', token);
  return url;
}

export const streamChat = async ({
  contextId,
  message,
  mode = 'standard',
  onChunk,
  onSources,
  onError,
}: {
  contextId: string;
  message: string;
  mode?: 'standard' | 'deep';
  onChunk: (chunk: string) => void;
  onSources: (sources: any[]) => void;
  onError: (error: string) => void;
}) => {
  const startedAt = Date.now();
  try {
    // Get access token from localStorage
    let token = getAccessTokenFromStorage();

    // Mask token for logs
    const mask = (t: string | null) => (t ? `${t.slice(0, 6)}...${t.slice(-6)}` : 'null');

    console.groupCollapsed('[chat-stream] streamChat init');
    console.log('[chat-stream] contextId:', contextId);
    console.log('[chat-stream] mode:', mode);
    console.log('[chat-stream] message length:', message?.length ?? 0);
    console.log('[chat-stream] token present:', !!token, 'token (masked):', mask(token));

    if (!token) {
      console.error('[chat-stream] No authentication token available');
      console.groupEnd();
      onError('No authentication token available');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return;
    }

    // Build SSE URL with query params (GET)
    let url = buildSSEUrl(contextId, message, mode, token);

    // CRITICAL DEBUGGING LOG - copy and paste in a new tab to test the stream
    console.log('[chat-stream] Connecting to EventSource with URL:', url.toString());
    console.groupEnd();

    await new Promise<void>((resolve) => {
      let hasRetried = false;
      let isRefreshing = false;
      let es: EventSource | null = new EventSource(url.toString());
      let bytesReceived = 0;

      const cleanup = (label: string) => {
        console.log('[chat-stream] cleanup called:', label, 'elapsed ms:', Date.now() - startedAt);
        try { es?.close(); } catch {}
        es = null;
        resolve();
      };

      const connectWithNewToken = async () => {
        if (hasRetried || !refreshTokenCallback) {
          console.error('[chat-stream] Retry blocked. hasRetried:', hasRetried, 'hasRefreshCb:', !!refreshTokenCallback);
          onError('Failed to connect to the chat service. Please try again.');
          cleanup('retry-blocked');
          return;
        }
        hasRetried = true;
        isRefreshing = true;
        try {
          console.log('[chat-stream] Attempting token refresh...');
          const newToken = await refreshTokenCallback();
          console.log('[chat-stream] refresh returned token (masked):', mask(newToken));
          // Update token from localStorage (refresh callback should have stored it)
          token = getAccessTokenFromStorage();
          console.log('[chat-stream] token from storage after refresh (masked):', mask(token));
          if (!token) throw new Error('Token not found after refresh');
          url = buildSSEUrl(contextId, message, mode, token);
          console.log('[chat-stream] Retrying EventSource with refreshed token. URL:', url.toString());
          try { es?.close(); } catch {}
          es = new EventSource(url.toString());
          wireHandlers();
        } catch (e) {
          console.error('[chat-stream] Token refresh failed during SSE:', e);
          onError('Authentication failed. Please log in again.');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
          cleanup('refresh-failed');
        } finally {
          isRefreshing = false;
        }
      };

      const wireHandlers = () => {
        if (!es) return;

        es.onopen = () => {
          console.log('[chat-stream] EventSource connection established. elapsed ms:', Date.now() - startedAt);
        };

        es.onmessage = (event) => {
          const raw = event?.data ?? '';
          bytesReceived += raw.length;
          // Server may send [DONE] sentinel or close the connection when done
          if (raw && raw.trim() === '[DONE]') {
            console.log('[chat-stream] [DONE] received. total bytes:', bytesReceived);
            cleanup('done');
            return;
          }
          try {
            const parsed = JSON.parse(raw);
            const keys = Object.keys(parsed || {});
            console.log('[chat-stream] message keys:', keys, 'chunk bytes:', raw.length, 'total bytes:', bytesReceived);
            if (parsed.response) {
              onChunk(parsed.response);
            }
            if (parsed.sources) {
              console.log('[chat-stream] sources count:', Array.isArray(parsed.sources) ? parsed.sources.length : 0);
              onSources(parsed.sources);
            }
            if (parsed.error) {
              console.error('[chat-stream] SSE payload error:', parsed.error);
              onError(parsed.error);
              cleanup('payload-error');
            }
          } catch (e) {
            // Non-JSON data; log a preview
            console.warn('[chat-stream] non-JSON SSE data preview:', raw.slice(0, 100));
          }
        };

        es.onerror = (err) => {
          // Prevent duplicate onerror during an in-flight refresh
          if (isRefreshing) {
            console.warn('[chat-stream] onerror ignored while refreshing');
            return;
          }
          // readyState: 0 = connecting, 1 = open, 2 = closed
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rs = (es as any)?.readyState;
          console.error('[chat-stream] EventSource onerror. readyState:', rs, 'elapsed ms:', Date.now() - startedAt, 'error:', err);
          // Try a one-time refresh and reconnect
          void connectWithNewToken();
        };
      };

      wireHandlers();
    });
  } catch (error) {
    console.error('[chat-stream] Fatal error in streamChat:', error);
    onError('An unexpected error occurred. Please try again.');
  }
};