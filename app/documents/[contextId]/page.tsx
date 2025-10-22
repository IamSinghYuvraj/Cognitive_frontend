
'use client';

import { DocumentList } from '@/components/DocumentList';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface DocumentPageProps {
  params: {
    contextId: string;
  };
}

export default function DocumentPage({ params }: DocumentPageProps) {
  return (
    <ProtectedRoute>
      <DocumentList contextId={params.contextId} />
    </ProtectedRoute>
  );
}
