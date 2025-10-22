
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Context, Document, ChatMessage } from './types';

interface AppState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;

  // Context state
  contexts: Context[];
  currentContext: Context | null;

  // Document state
  documents: Document[];

  // Chat state
  messages: ChatMessage[];
  isStreaming: boolean;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setAuth: (token: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
  setContexts: (contexts: Context[]) => void;
  setCurrentContext: (context: Context | null) => void;
  addContext: (context: Context) => void;
  updateContext: (context: Context) => void;
  deleteContext: (contextId: string) => void;
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  deleteDocument: (documentId: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  clearHistory: () => void;
  setStreaming: (isStreaming: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      contexts: [],
      currentContext: null,
      documents: [],
      messages: [],
      isStreaming: false,
      isLoading: false,
      error: null,

      // Actions
      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user, isAuthenticated: !!token }),
      clearAuth: () => set({ token: null, refreshToken: null, user: null, isAuthenticated: false }),
      setContexts: (contexts) => set({ contexts }),
      setCurrentContext: (context) => set({ currentContext: context }),
      addContext: (context) => set((state) => ({ contexts: [...state.contexts, context] })),
      updateContext: (context) =>
        set((state) => ({
          contexts: state.contexts.map((c) => (c.id === context.id ? context : c)),
        })),
      deleteContext: (contextId) =>
        set((state) => ({ contexts: state.contexts.filter((c) => c.id !== contextId) })),
      setDocuments: (documents) => set({ documents }),
      addDocument: (document) => set((state) => ({ documents: [...state.documents, document] })),
      deleteDocument: (documentId) =>
        set((state) => ({ documents: state.documents.filter((d) => d.id !== documentId) })),
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      clearHistory: () => set({ messages: [] }),
      setStreaming: (isStreaming) => set({ isStreaming }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'app-storage',
    }
  )
);
