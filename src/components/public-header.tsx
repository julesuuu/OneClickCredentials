"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserButton } from "@daveyplate/better-auth-ui";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative">
            <Image
              src="/icon.svg"
              alt="OneClick Credentials"
              width={30}
              height={30}
              className="size-8"
            />
          </div>
          <span className="text-xl font-bold text-foreground">
            OneClick Credentials
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton size="icon" />
        </nav>
        {/* hamburger dropdown
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
        </details> */}
      </div>
    </header>
  );
}
