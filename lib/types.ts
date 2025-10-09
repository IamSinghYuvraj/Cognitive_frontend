export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Context {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  sources: Source[];
}

export interface Source {
  filename: string;
  content_preview: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User;
}

export interface CreateContextRequest {
  name: string;
  file: File;
}