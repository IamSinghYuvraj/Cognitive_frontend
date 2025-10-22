export interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

export interface Context {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
  document_count: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: string;
}

export interface ChatResponse {
  response: string;
  sources: Source[];
}

export interface Source {
  filename: string;
  content_preview: string;
  download_url: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User;
}

export interface CreateContextRequest {
  name: string;
  files: File[];
}

export interface UploadResponse {
  context_id: string;
  processed_files: number;
  document_ids: string[];
}

export enum DocumentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface Document {
  id: string;
  filename: string;
  created_at: string;
  status: DocumentStatus;
  download_url: string;
}
