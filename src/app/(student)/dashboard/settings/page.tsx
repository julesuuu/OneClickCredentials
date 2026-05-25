import { getProfile } from "./profile/actions";
import { ProfileForm } from "./profile/ProfileForm";

export default async function SettingsPage() {
  const data = await getProfile();

  if (!data) {
    return (
      <div className="max-w-2xl">
        <p className="text-muted-foreground">
          Complete your onboarding first to access profile settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 mx-auto max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1.5">
          Manage your personal information and preferences
        </p>
      </div>
      <ProfileForm initialData={data} />
    </div>
  );
}
