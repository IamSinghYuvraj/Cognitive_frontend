'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader as Loader2, User, Bot, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatAPI } from '@/lib/api';
import { ChatMessage, Source } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/auth-store';

interface ChatInterfaceProps {
  contextId: string;
  contextName: string;
}

export function ChatInterface({ contextId, contextName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await chatAPI.getChatHistory(contextId);
        setMessages(response.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch chat history.',
          variant: 'destructive',
        });
      } finally {
        setIsHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [contextId, toast]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, assistantMessage]);

    const { token } = useAuthStore.getState();
    const eventSource = new EventSource(
      `http://localhost:8000/api/chat/${contextId}?message=${encodeURIComponent(input.trim())}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.response) {
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1
              ? { ...msg, content: msg.content + data.response }
              : msg
          )
        );
      } else if (data.sources) {
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, sources: data.sources } : msg
          )
        );
        setIsLoading(false);
        eventSource.close();
      } else if (data.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
        setIsLoading(false);
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      setMessages((prev) => prev.slice(0, -2));
      setIsLoading(false);
      eventSource.close();
    };
  };

  const handleClearChat = async () => {
    try {
      await chatAPI.clearChatHistory(contextId);
      setMessages([]);
      toast({
        title: 'Success',
        description: 'Chat history cleared.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear chat history.',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{contextName}</h2>
          <p className="text-sm text-muted-foreground">
            Ask questions about your document
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={handleClearChat}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {isHistoryLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Start a conversation by asking a question about your document
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && (
                        <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      )}
                      {message.role === 'user' && (
                        <User className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.sources && (
                          <div className="mt-2">
                            <h3 className="text-xs font-semibold">Sources:</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {message.sources.map((source, i) => (
                                <Card key={i} className="p-2 text-xs bg-background">
                                  <p className="font-medium">{source.filename}</p>
                                  <p className="text-muted-foreground truncate">{source.content_preview}</p>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
          
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <Card className="bg-muted">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5" />
                    <div className="flex items-center space-x-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your document..."
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="lg"
            className="px-6"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
