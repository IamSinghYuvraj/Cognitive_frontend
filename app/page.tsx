'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CreateContextModal } from '@/components/CreateContextModal';
import { contextAPI } from '@/lib/api';
import { Context } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
export default function Dashboard() {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const fetchContexts = async () => {
    try {
      const response = await contextAPI.getContexts();
      setContexts(response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load contexts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchContexts();
  }, []);
  const handleDeleteContext = async (contextId: string, contextName: string) => {
    if (!confirm(`Are you sure you want to delete "${contextName}"?`)) {
      return;
    }
    try {
      await contextAPI.deleteContext(contextId);
      setContexts(contexts.filter(c => c.id !== contextId));
      toast({
        title: 'Success',
        description: 'Context deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete context',
        variant: 'destructive',
      });
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your document contexts and start conversations
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Context
          </Button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading contexts...</p>
            </div>
          </div>
        ) : contexts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No contexts yet</CardTitle>
              <CardDescription className="text-center mb-4">
                Create your first context by uploading a PDF document
              </CardDescription>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Context
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contexts.map((context) => (
              <Card key={context.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{context.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(context.created_at)}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteContext(context.id, context.name)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href={`/chat/${context.id}`}>
                    <Button className="w-full">
                      Start Chat
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <CreateContextModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSuccess={fetchContexts}
        />
      </div>
    </ProtectedRoute>
  );
}