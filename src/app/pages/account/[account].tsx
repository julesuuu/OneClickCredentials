import { AccountView } from "@daveyplate/better-auth-ui";
import { accountViewPaths } from "@daveyplate/better-auth-ui/server";

export default function AccountPage({ path }: { path: string }) {
  return (
    <main className="container mx-auto p-4 md:p-6">
      <AccountView path={path} />
    </main>
  );
}

export async function getStaticPaths() {
  return {
    paths: Object.values(accountViewPaths).map((path) => ({
      params: { path },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { path: string } }) {
  return { props: { path: params.path } };
}
