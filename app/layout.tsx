import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Providers } from '@/providers';

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
              {/* Background Pattern */}
              <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
              
              <Sidebar />
              <main className="flex-1 overflow-auto">
                <div className="container max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
                  <Breadcrumb />
                  {children}
                </div>
              </main>
            </div>
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
