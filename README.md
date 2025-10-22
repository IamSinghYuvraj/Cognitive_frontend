# Cognitive AI Frontend

A modern React/Next.js frontend for the Cognitive AI Backend - an intelligent document chat system with RAG capabilities.

## Features

✅ **Authentication System**
- Login/Signup with JWT tokens
- Auto token refresh on expiration
- Protected routes
- Secure token storage

✅ **Document Management**
- Upload multiple PDFs (up to 15 files, 10MB each)
- Drag & drop interface
- Context-based organization
- File validation

✅ **Chat Interface**
- Real-time streaming responses (SSE)
- Two modes:
  - **Standard Mode**: Fast responses (1-3s)
  - **Deep Thinking Mode**: Multi-step reasoning (5-10s)
- Message history
- Source citations
- Clear chat functionality

✅ **Context Management**
- Create contexts from PDF uploads
- List all contexts
- Select context to chat
- Delete contexts
- Search functionality

## Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Form Handling**: React Hook Form + Zod

## Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment**

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. **Run Development Server**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Backend Integration

This frontend integrates with the Cognitive AI Backend at `http://localhost:8000`.

### API Endpoints Used

**Authentication**
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login (returns access_token, refresh_token)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

**Documents**
- `POST /api/documents/upload` - Upload PDFs with context_name
  - Accepts: `multipart/form-data` with `files[]` and `context_name`
  - Max 15 PDFs, 10MB each
  - Returns: `{context_id, processed_files, document_ids}`

**Chat**
- `POST /api/chat/{context_id}?mode=standard|deep` - Send message (SSE streaming)
  - Standard: Fast responses (1-3s)
  - Deep: Multi-step reasoning (5-10s)
  - Request: `{message: string}`
  - Response: SSE stream with `data: {"response": "text"}` or `data: {"error": "msg"}`

**History & Contexts**
- `GET /api/chat/history/{context_id}` - Get chat messages
- `DELETE /api/chat/clear/{context_id}` - Clear chat history
- `GET /api/contexts/` - List all contexts
- `GET /api/contexts/{context_id}` - Get specific context
- `DELETE /api/contexts/{context_id}` - Delete context

## Project Structure

```
├── app/                      # Next.js app directory
│   ├── chat/[contextId]/    # Chat page
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Dashboard
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── ChatInterface.tsx    # Chat UI with streaming
│   ├── CreateContextModal.tsx # Upload modal
│   ├── Sidebar.tsx          # Navigation sidebar
│   └── ProtectedRoute.tsx   # Auth guard
├── lib/                     # Utilities
│   ├── api.ts              # API functions
│   ├── apiClient.ts        # Axios instance with interceptors
│   ├── app-store.ts        # Zustand state management
│   ├── chat-stream.ts      # SSE streaming handler
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Helper functions
└── hooks/                   # Custom React hooks
```

## Key Features Implementation

### Token Management
- Access tokens stored in Zustand (persisted to localStorage)
- Automatic refresh on 401 responses
- Request queue during token refresh
- Redirect to login on refresh failure

### SSE Streaming
- Real-time message streaming from backend
- Chunk-by-chunk display
- Error handling in stream
- Source citations support

### File Upload
- Multiple file selection
- Drag & drop support
- File type validation (PDF only)
- Size validation (10MB per file)
- Count validation (max 15 files)
- Progress feedback

### Mode Selection
- Toggle between Standard and Deep Thinking modes
- Visual indicators for response time
- Mode persists during chat session

## Error Handling

All API errors return:
```json
{
  "success": false,
  "error": "Error message",
  "error_code": "ERROR_CODE"
}
```

Handled status codes:
- `401` - Unauthorized (triggers token refresh)
- `403` - Forbidden
- `404` - Not found
- `422` - Validation error
- `503` - Service unavailable

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
