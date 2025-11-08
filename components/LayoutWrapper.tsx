'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';

// Pages that should not have sidebar and breadcrumb
const AUTH_PAGES = ['/login', '/signup', '/oauth/callback'];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname && AUTH_PAGES.some(page => pathname.startsWith(page));
  const [open, setOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  if (isAuthPage) {
    // Auth pages get full-screen layout without sidebar
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        {/* Background Pattern */}
        <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
        {children}
      </div>
    );
  }

  // Authenticated pages get sidebar and breadcrumb
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      {/* Desktop Sidebar (toggleable) */}
      {desktopOpen && <Sidebar variant="desktop" />}

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[18rem]">
                <Sidebar variant="mobile" onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="text-sm text-muted-foreground">Menu</div>
          </div>
        </div>

        <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Desktop toolbar with sidebar toggle and breadcrumb */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label={desktopOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              onClick={() => setDesktopOpen(v => !v)}
            >
              {desktopOpen ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
            </Button>
            <Breadcrumb />
          </div>

          {/* Keep breadcrumb hidden on mobile to save space */}
          <div className="md:hidden" />

          {children}
        </div>
      </main>
    </div>
  );
}
