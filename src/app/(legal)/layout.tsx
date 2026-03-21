import { PublicHeader } from "@/components/public-header";
import { SignedOut } from "@daveyplate/better-auth-ui";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main>{children}</main>
      <footer className="w-full border-t py-8 bg-muted/30 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 OneClick Credentials. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
