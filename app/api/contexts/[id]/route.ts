import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = params;
    
    // Forward the request to your backend API
    const response = await fetch(`${process.env.API_URL}/api/contexts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return new NextResponse(error.message || 'Failed to delete context', { 
        status: response.status 
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting context:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
