'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Trash2, Calendar, Search, TrendingUp, Sparkles, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateContextModal } from '@/components/CreateContextModal';
import { ProtectedRoute } from '@/components/ProtectedRoute';
// Remove direct API import since we'll use fetch
import { Context } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const fetchContexts = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/contexts');
      if (!response.ok) {
        throw new Error('Failed to fetch contexts');
      }
      const data = await response.json();
      setContexts(data);
    } catch (error: any) {
      console.error('Failed to load contexts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contexts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, toast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchContexts();
    }
  }, [isAuthenticated, fetchContexts]);

  const handleDeleteContext = async (contextId: string, contextName: string) => {
    if (!confirm(`Are you sure you want to delete "${contextName}"?`)) {
      return;
    }
    try {
      // Use the appropriate API method to delete the context
      await fetch(`/api/contexts/${contextId}`, {
        method: 'DELETE',
      });
      
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

  const filteredContexts = contexts.filter(context =>
    context.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl pointer-events-none" />
          <div className="relative bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent border border-border/40 rounded-2xl p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                </div>
                <p className="text-muted-foreground text-lg">
                  Manage your document contexts and start intelligent conversations
                </p>
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Context
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/40 bg-gradient-to-br from-blue-500/5 to-transparent hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Contexts</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{contexts.length}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Active document collections
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-gradient-to-br from-purple-500/5 to-transparent hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {contexts.reduce((acc, curr) => acc + (curr.document_count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                PDFs ready for analysis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contexts..."
            className="pl-12 h-12 bg-muted/30 border-border/40 rounded-xl focus:ring-2 focus:ring-blue-500/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredContexts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <CardDescription className="text-center mb-4">
                {searchQuery ? `No results for "${searchQuery}"` : 'Create your first context by uploading a PDF document'}
              </CardDescription>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Context
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredContexts.map((context) => (
              <Card key={context.id} className="group border-border/40 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardHeader className="pb-3 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {context.name}
                      </CardTitle>
                      <div className="space-y-1 mt-2">
                        <CardDescription className="flex items-center text-xs">
                          <Calendar className="mr-1.5 h-3.5 w-3.5" />
                          {formatDate(context.created_at)}
                        </CardDescription>
                        <CardDescription className="flex items-center text-xs">
                          <FileText className="mr-1.5 h-3.5 w-3.5" />
                          {context.document_count} {context.document_count === 1 ? 'document' : 'documents'}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteContext(context.id, context.name)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 relative">
                  <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md group-hover:shadow-lg transition-all">
                    <Link href={`/chat/${context.id}`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Start Chat
                    </Link>
                  </Button>
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
  );
}
