import { useState, useEffect, useCallback } from 'react';
import { chatAPI } from '@/lib/api';
import { ChatMessage } from '@/lib/types';
import { streamChat } from '@/lib/chat-stream';

export const useChat = (contextId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Fetch initial chat history
  useEffect(() => {
    if (!contextId) {
      setIsLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('[useChat] Fetching chat history for context:', contextId);
        
        const history = await chatAPI.getChatHistory(contextId);
        console.log('[useChat] Chat history received. items:', Array.isArray(history) ? history.length : 0);
        
        // Ensure messages are properly formatted
        const formattedMessages = Array.isArray(history) 
          ? history.map((msg: any, idx: number) => ({
              role: msg.role || 'assistant',
              content: msg.content || '',
              timestamp: msg.timestamp || new Date().toISOString(),
              sources: msg.sources || undefined,
            }))
          : [];
        
        setMessages(formattedMessages);
        console.log('[useChat] Messages state initialized with', formattedMessages.length, 'messages');
      } catch (err: any) {
        console.error('[useChat] Failed to load chat history:', err);
        const errorMessage = err.response?.data?.detail || err.message || 'Failed to load chat history.';
        setError(errorMessage);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [contextId]);

  // Function to send a new message and handle the stream
  const sendMessage = useCallback(async (messageText: string, mode: 'standard' | 'deep' = 'standard') => {
    if (!messageText.trim() || !contextId || isStreaming) {
      console.warn('[useChat] sendMessage blocked. contextId:', contextId, 'isStreaming:', isStreaming, 'message length:', messageText?.length ?? 0);
      return;
    }

    const startedAt = Date.now();
    console.groupCollapsed('[useChat] sendMessage start');
    console.log('[useChat] contextId:', contextId);
    console.log('[useChat] mode:', mode);
    console.log('[useChat] message length:', messageText.trim().length);

    // Add user's message to the UI immediately (optimistic update)
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => {
      const next = [...prev, userMessage];
      console.log('[useChat] optimistic user message appended. total messages:', next.length);
      return next;
    });

    // Create an assistant message placeholder that we will update
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => {
      const next = [...prev, assistantMessage];
      console.log('[useChat] assistant placeholder appended. total messages:', next.length);
      return next;
    });
    setIsStreaming(true);
    setError(null);
    console.groupEnd();

    try {
      let cumulativeLen = 0;
      await streamChat({
        contextId,
        message: messageText.trim(),
        mode,
        onChunk: (chunk: string) => {
          cumulativeLen += chunk.length;
          console.log('[useChat] onChunk len:', chunk.length, 'cumulative:', cumulativeLen);
          // Append the new chunk to the assistant's message content
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content = (lastMsg.content || '') + chunk;
            }
            return newMessages;
          });
        },
        onSources: (sources: any[]) => {
          console.log('[useChat] onSources count:', Array.isArray(sources) ? sources.length : 0);
          // Update the assistant message with sources
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.sources = sources;
            }
            return newMessages;
          });
        },
        onError: (errorMessage: string) => {
          console.error('[useChat] stream error:', errorMessage, 'elapsed ms:', Date.now() - startedAt);
          setError(errorMessage);
          // Update the last message with error
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content = `Error: ${errorMessage}`;
            }
            return newMessages;
          });
        },
      });
      console.log('[useChat] stream finished. elapsed ms:', Date.now() - startedAt);
    } catch (err: any) {
      console.error('[useChat] sendMessage exception:', err);
      const errorMessage = err.message || 'Failed to send message. Please try again.';
      setError(errorMessage);
      
      // Remove the user and assistant messages on error
      setMessages(prev => {
        const next = prev.slice(0, -2);
        console.log('[useChat] rolled back optimistic messages. total messages:', next.length);
        return next;
      });
      
      throw err;
    } finally {
      setIsStreaming(false);
    }
  }, [contextId, isStreaming]);

  // Function to clear chat history
  const clearChat = useCallback(async () => {
    if (!contextId) return;
    
    try {
      await chatAPI.clearChatHistory(contextId);
      setMessages([]);
      setError(null);
      console.log('[useChat] chat history cleared');
    } catch (err: any) {
      console.error('[useChat] Failed to clear chat:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to clear chat history.';
      setError(errorMessage);
      throw err;
    }
  }, [contextId]);

  return {
    messages,
    isLoading,
    error,
    isStreaming,
    sendMessage,
    clearChat,
  };
};

