import { AuthView } from "@daveyplate/better-auth-ui";
import { authViewPaths } from "@daveyplate/better-auth-ui/server";
import Link from "next/link";

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

  return (
    <div className="flex min-h-screen w-full items-center justify-center">
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
