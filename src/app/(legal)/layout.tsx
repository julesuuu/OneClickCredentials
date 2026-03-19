import { PublicHeader } from "@/components/public-header";
import { SignedOut } from "@daveyplate/better-auth-ui";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedOut>
        <PublicHeader />
      </SignedOut>
      <main>{children}</main>
    </>
  );
}
