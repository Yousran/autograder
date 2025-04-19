import { DecodedToken } from "@/types/token";

export function SecuritySettings({ user }: { user: DecodedToken | null }) {
  return (
    <div className="space-y-6 max-w-md">
      <h2 className="text-xl font-semibold">Profile Settings</h2>
      <p className="text-md font-medium my-2 text-muted-foreground">
        Manage your security settings here.
      </p>
      {user?.userId}
      {/* Tambahkan komponen pengaturan keamanan lainnya di sini */}
    </div>
  );
}
