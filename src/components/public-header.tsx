"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-primary"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-teal-500" />
          </div>
          <span className="text-xl font-bold text-foreground">
            OneClick Credentials
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" className="text-foreground" asChild>
            <Link href="/auth/sign-in">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/sign-up">Sign Up Free</Link>
          </Button>
        </nav>
        <details className="md:hidden">
          <summary className="list-none cursor-pointer p-2 text-foreground">
            <Menu className="h-6 w-6" />
          </summary>
          <div className="absolute top-16 left-0 right-0 border-t bg-background px-4 py-4 space-y-2">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-bold text-muted-foreground">
                Theme
              </span>
              <ThemeToggle />
            </div>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/auth/sign-in">Log In</Link>
            </Button>
            <Button className="w-full justify-start" asChild>
              <Link href="/auth/sign-up">Sign Up Free</Link>
            </Button>
          </div>
        </details>
      </div>
    </header>
  );
}
