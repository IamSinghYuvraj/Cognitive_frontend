'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ChatInterface } from '@/components/ChatInterface';
import { contextAPI } from '@/lib/api';
import { Context } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function ChatPage() {
	const params = useParams();
	const router = useRouter();
	const contextId = params.contextId as string;
	const [context, setContext] = useState<Context | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const { toast } = useToast();

	useEffect(() => {
		const fetchContext = async () => {
			try {
				const response = await contextAPI.getContext(contextId);
				setContext(response.data);
			} catch (error: any) {
				toast({
					title: 'Error',
					description: 'Failed to load context',
					variant: 'destructive',
				});
				router.push('/');
			} finally {
				setIsLoading(false);
			}
		};

		if (contextId) {
			fetchContext();
		}
	}, [contextId, router, toast]);

	if (isLoading) {
		return (
			<ProtectedRoute>
				<div className="flex items-center justify-center py-12">
					<div className="text-center">
						<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
						<p className="text-muted-foreground">Loading context...</p>
					</div>
				</div>
			</ProtectedRoute>
		);
	}

	if (!context) {
		return (
			<ProtectedRoute>
				<div className="text-center py-12">
					<p className="text-muted-foreground">Context not found</p>
					<Button onClick={() => router.push('/')} className="mt-4">
						Back to Dashboard
					</Button>
				</div>
			</ProtectedRoute>
		);
	}

	return (
		<ProtectedRoute>
			<div className="space-y-4">
				<div className="flex items-center space-x-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push('/')}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Dashboard
					</Button>
				</div>

				<div className="grid grid-cols-1 h-[calc(100vh-200px)]">
					{/* Chat Interface */}
					<div className="h-full border rounded-lg">
						<ChatInterface
							contextId={contextId}
							contextName={context.name}
						/>
					</div>
				</div>
			</div>
		</ProtectedRoute>
	);
}
