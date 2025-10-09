import './globals.css';
import { Inter } from 'next/font/google';
import { Header } from '@/components/Header';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Cognitive - AI Document Chat',
  description: 'Upload PDF documents and chat with AI about their content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto py-6">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}