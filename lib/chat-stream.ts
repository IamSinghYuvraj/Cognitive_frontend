
import { useAuthStore } from './auth-store';

export const streamChat = async ({
  contextId,
  message,
  onChunk,
  onSources,
  onError,
}: {
  contextId: string;
  message: string;
  onChunk: (chunk: string) => void;
  onSources: (sources: any[]) => void;
  onError: (error: string) => void;
}) => {
  const token = useAuthStore.getState().token;
  const response = await fetch(
    (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + `/api/chat/${contextId}`,
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

  if (!response.body) {
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
