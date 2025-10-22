# API Integration Guide

## Overview
This document describes how the frontend integrates with the Cognitive AI Backend API.

## Base URL
```
http://localhost:8000/api
```

## Authentication

### Login
```typescript
// POST /api/auth/login
const response = await authAPI.login(email, password);
// Returns: { access_token, refresh_token, token_type, user }

// Tokens are stored in Zustand store and persisted to localStorage
```

### Signup
```typescript
// POST /api/auth/signup
const response = await authAPI.signup(email, password, fullName);
// Returns: { id, email, full_name }
```

### Token Refresh
Automatic token refresh is handled by `apiClient.ts` interceptor:
- Detects 401 responses
- Calls `/api/auth/refresh` with refresh_token
- Retries original request with new access_token
- Redirects to login if refresh fails

## Document Upload

### Upload PDFs to Create Context
```typescript
// POST /api/documents/upload
const formData = new FormData();
formData.append('context_name', 'My Research Papers');
files.forEach(file => formData.append('files', file)); // Max 15 files, 10MB each

const response = await contextAPI.createContext({ name, files });

// Response: UploadResponse
{
  context_id: "uuid-string",
  processed_files: 3,
  document_ids: ["doc-id-1", "doc-id-2", "doc-id-3"]
}

// After successful upload, navigate to: /chat/${context_id}
```

### Validation
- **File Type**: Only PDF (application/pdf)
- **File Size**: Max 10MB per file
- **File Count**: Max 15 files per upload
- **Context Name**: Required, non-empty string

### Error Handling
```typescript
try {
  const response = await contextAPI.createContext({ name, files });
} catch (error) {
  // Backend returns: { success: false, error: string, error_code: string }
  const errorMessage = error.response?.data?.error || 
                       error.response?.data?.detail || 
                       'Upload failed';
  // Display error to user
}
```

## Chat Interface

### Send Message with Streaming
```typescript
// POST /api/chat/{context_id}?mode=standard|deep
await streamChat({
  contextId: 'uuid-string',
  message: 'What is the main topic?',
  mode: 'standard', // or 'deep'
  onChunk: (chunk) => {
    // Append chunk to assistant message
    // chunk is a string fragment
  },
  onSources: (sources) => {
    // Update message with source citations
    // sources: [{ filename, content_preview, download_url }]
  },
  onError: (error) => {
    // Handle error message
  }
});
```

### Mode Options
- **standard**: Fast responses (1-3 seconds)
  - Quick retrieval and generation
  - Good for simple questions
  
- **deep**: Accurate multi-step reasoning (5-10 seconds)
  - Advanced reasoning
  - Better for complex questions

### SSE Stream Format
```
data: {"response": "text chunk"}
data: {"response": " more text"}
data: {"sources": [{...}]}
data: {"error": "error message"}
data: [DONE]
```

### Error Handling
```typescript
// Non-OK response (4xx, 5xx)
if (!response.ok) {
  const errorData = await response.json();
  // errorData.error or errorData.detail contains error message
}

// Stream error
data: {"error": "Context not found"}
```

## Context Management

### List All Contexts
```typescript
// GET /api/contexts/
const response = await contextAPI.getContexts();
// Returns: Context[]
[
  {
    id: "uuid",
    name: "Research Papers",
    created_at: "2025-10-22T14:00:00Z",
    user_id: "user-uuid",
    document_count: 3
  }
]
```

### Get Single Context
```typescript
// GET /api/contexts/{context_id}
const response = await contextAPI.getContext(contextId);
// Returns: Context
```

### Delete Context
```typescript
// DELETE /api/contexts/{context_id}
await contextAPI.deleteContext(contextId);
// Returns: void (204 No Content)
```

## Chat History

### Get Chat History
```typescript
// GET /api/chat/history/{context_id}
const response = await chatAPI.getChatHistory(contextId);
// Returns: ChatMessage[]
[
  {
    role: "user",
    content: "What is this about?",
    timestamp: "2025-10-22T14:05:00Z"
  },
  {
    role: "assistant",
    content: "This document discusses...",
    sources: [{...}],
    timestamp: "2025-10-22T14:05:03Z"
  }
]
```

### Clear Chat History
```typescript
// DELETE /api/chat/clear/{context_id}
await chatAPI.clearChatHistory(contextId);
// Returns: void
```

## Error Response Format

All API errors follow this format:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "error_code": "ERROR_CODE_CONSTANT"
}
```

### Common Error Codes
- `401`: Unauthorized - Invalid or expired token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `422`: Validation Error - Invalid request data
- `503`: Service Unavailable - Backend service error

## Implementation Details

### File Upload Component
Location: `components/CreateContextModal.tsx`
- Drag & drop interface using react-dropzone
- Multiple file selection
- Real-time validation
- Progress feedback
- Auto-navigation to chat after upload

### Chat Streaming Component
Location: `components/ChatInterface.tsx`
- Real-time SSE streaming
- Mode toggle (Standard/Deep)
- Message history
- Source citations
- Error handling

### API Client
Location: `lib/apiClient.ts`
- Axios instance with interceptors
- Automatic token injection
- Token refresh on 401
- Request queue during refresh

### Chat Streaming
Location: `lib/chat-stream.ts`
- Fetch API with ReadableStream
- SSE parsing
- Chunk-by-chunk updates
- Error handling

## Testing Checklist

### Upload Flow
- [ ] Select 1 PDF → Upload succeeds
- [ ] Select 15 PDFs → Upload succeeds
- [ ] Select 16 PDFs → Validation error shown
- [ ] Select non-PDF → Validation error shown
- [ ] Select >10MB file → Validation error shown
- [ ] Empty context name → Validation error shown
- [ ] Successful upload → Navigate to chat

### Chat Flow
- [ ] Send message in standard mode → Response streams
- [ ] Send message in deep mode → Response streams (slower)
- [ ] Switch modes → New mode used for next message
- [ ] Receive error in stream → Error displayed
- [ ] Network error → Error handled gracefully
- [ ] Clear history → Messages cleared

### Auth Flow
- [ ] Login with valid credentials → Tokens stored
- [ ] Login with invalid credentials → Error shown
- [ ] Access protected route → Token sent in header
- [ ] Token expires → Auto-refresh triggered
- [ ] Refresh fails → Redirect to login
- [ ] Logout → Tokens cleared

## Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Documentation

Full API documentation available at:
```
http://localhost:8000/api/docs
```
