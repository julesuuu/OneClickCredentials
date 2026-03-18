import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              OneClickCredentials
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className="text-sm font-medium hover:underline"
              >
                Sign In
              </Link>
            </div>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-sm text-muted-foreground">
          © {new Date().getFullYear()} OneClickCredentials. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
