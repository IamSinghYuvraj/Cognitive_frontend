"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, LogOut, User as UserIcon, Sun, Moon, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { name: "Dashboard", href: "/", icon: Home, badge: null },
  { name: "Contexts", href: "/contexts", icon: FileText, badge: null },
];

type SidebarProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

export function Sidebar({ variant = "desktop", onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    onNavigate?.();
  };

  const containerClassName =
    variant === "desktop"
      ? "hidden md:flex md:w-64 lg:w-72 flex-col h-screen bg-gradient-to-b from-background to-muted/20 border-r border-border/40 backdrop-blur-xl"
      : "w-full max-w-[18rem] flex flex-col h-full bg-gradient-to-b from-background to-muted/20 border-r border-border/40";

  return (
    <aside className={containerClassName}>
      {/* Header with Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur-lg opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl">
              <Brain className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Cognitive
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI-Powered Insights
            </p>
          </div>
        </div>
        <Separator className="mt-4" />
      </div>
      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.name}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start group relative overflow-hidden transition-all duration-200 ${
                isActive 
                  ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 shadow-sm" 
                  : "hover:bg-muted/50"
              }`}
              onClick={onNavigate}
            >
              <Link href={item.href}>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r" />
                )}
                <item.icon className={`mr-3 h-4 w-4 transition-colors ${
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground group-hover:text-foreground"
                }`} />
                <span className={isActive ? "font-medium" : ""}>{item.name}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            </Button>
          );
        })}
      </nav>
      {/* Theme Toggle */}
      <div className="px-4 py-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start group hover:bg-muted/50"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-4 w-4 mr-3 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 ml-[-0.75rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="ml-6">Toggle Theme</span>
        </Button>
      </div>

      <Separator className="mx-4" />

      {/* User Profile */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/40">
          <Avatar className="h-10 w-10 ring-2 ring-blue-500/20">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || <UserIcon className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start group hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}