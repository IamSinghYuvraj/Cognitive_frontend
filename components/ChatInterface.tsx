'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader as Loader2, User, Bot, Trash2, Zap, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { chatAPI } from '@/lib/api';
import { ChatMessage, Source } from '@/lib/types';
import { streamChat } from '@/lib/chat-stream';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/app-store';

interface ChatInterfaceProps {
  contextId: string;
  contextName: string;
}

export function ChatInterface({ contextId, contextName }: ChatInterfaceProps) {
  const {
    messages,
    setMessages,
    addMessage,
    isStreaming,
    setStreaming,
    clearHistory,
  } = useAppStore();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'standard' | 'deep'>('standard');
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
  }, [contextId, toast, setMessages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);
    setInput('');
    setStreaming(true);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    addMessage(assistantMessage);

    try {
      await streamChat({
        contextId,
        message: userMessage.content,
        mode,
        onChunk: (chunk) => {
          useAppStore.setState((state) => ({
            messages: state.messages.map((msg, index) =>
              index === state.messages.length - 1
                ? { ...msg, content: msg.content + chunk }
                : msg
            ),
          }));
        },
        onSources: (sources) => {
          useAppStore.setState((state) => ({
            messages: state.messages.map((msg, index) =>
              index === state.messages.length - 1 ? { ...msg, sources } : msg
            ),
          }));
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error,
            variant: 'destructive',
          });
          useAppStore.setState((state) => ({
            messages: state.messages.slice(0, -2),
          }));
        },
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      useAppStore.setState((state) => ({
        messages: state.messages.slice(0, -2),
      }));
    } finally {
      setStreaming(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await chatAPI.clearChatHistory(contextId);
      clearHistory();
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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 space-y-3">
        <div className="flex justify-between items-center">
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
        
        {/* Mode Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Mode:</span>
          <ToggleGroup type="single" value={mode} onValueChange={(value) => value && setMode(value as 'standard' | 'deep')}>
            <ToggleGroupItem value="standard" aria-label="Standard mode" className="gap-2">
              <Zap className="h-4 w-4" />
              Standard
              <Badge variant="secondary" className="ml-1 text-xs">1-3s</Badge>
            </ToggleGroupItem>
            <ToggleGroupItem value="deep" aria-label="Deep thinking mode" className="gap-2">
              <Brain className="h-4 w-4" />
              Deep Thinking
              <Badge variant="secondary" className="ml-1 text-xs">5-10s</Badge>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
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
                className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
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
                                <a key={i} href={source.download_url} download>
                                  <Card className="p-2 text-xs bg-background hover:bg-accent">
                                    <p className="font-medium">{source.filename}</p>
                                    <p className="text-muted-foreground truncate">{source.content_preview}</p>
                                  </Card>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="text-xs text-muted-foreground mt-1 px-2">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            ))
          )}
          
          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
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
            disabled={isStreaming}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            size="lg"
            className="px-6"
          >
            {isStreaming ? (
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