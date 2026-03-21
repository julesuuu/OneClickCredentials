import { AuthView } from "@daveyplate/better-auth-ui";
import { authViewPaths } from "@daveyplate/better-auth-ui/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const redirectUrl = session ? "/dashboard" : "/";

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center">
      <div className="absolute left-6 top-6">
        <Button variant="ghost" size="default" asChild>
          <Link href={redirectUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Link>
        </Button>
      </div>
      <main className="w-full max-w-sm flex flex-col items-center gap-4 p-4 md:p-6">
        <AuthView path={path} />

        {!["callback", "sign-out"].includes(path) && (
          <p className="w-full text-center text-muted-foreground text-xs">
            By continuing, you agree to our{" "}
            <Link className="text-warning underline" href="/terms-of-service">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link className="text-warning underline" href="/privacy-policy">
              Privacy Policy
            </Link>
            .
          </p>
        )}
      </main>
    </div>
  );
}
