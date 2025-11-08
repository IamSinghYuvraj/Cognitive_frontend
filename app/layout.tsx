import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Providers } from '@/providers';
import { LayoutWrapper } from '@/components/LayoutWrapper';

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
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
