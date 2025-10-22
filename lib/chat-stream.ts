import { useAppStore } from './app-store';

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
  const token = useAppStore.getState().token;
  const response = await fetch(
    (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + `/api/chat/${contextId}?mode=${mode}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    }
  );

  // Check for non-OK responses
  if (!response.ok) {
    try {
      const errorData = await response.json();
      onError(errorData.error || errorData.detail || 'Chat request failed');
    } catch {
      onError(`Request failed with status ${response.status}`);
    }
    return;
  }

  if (!response.body) {
    onError('No response body received');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.substring(6);
        if (data.trim() === '[DONE]') {
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.response) {
            onChunk(parsed.response);
          }
          if (parsed.sources) {
            onSources(parsed.sources);
          }
          if (parsed.error) {
            onError(parsed.error);
          }
        } catch (e) {
          console.error('Error parsing stream data:', e);
        }
      }
    }
  }
};