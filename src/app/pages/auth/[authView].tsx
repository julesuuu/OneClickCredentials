import { AuthView } from "@daveyplate/better-auth-ui";
import { authViewPaths } from "@daveyplate/better-auth-ui/server";

export default function AuthPage({ path }: { path: string }) {
  return (
    <main className="container mx-auto flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
      <AuthView path={path} />
    </main>
  );
}

export async function getStaticPaths() {
  return {
    paths: Object.values(authViewPaths).map((path) => ({ params: { path } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { path: string } }) {
  return { props: { path: params.path } };
}
