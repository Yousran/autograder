import { notFound } from "next/navigation";
import Navbar from "@/components/custom/navbar";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/dal";
import { Card } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import ProfileAvatarClient from "@/components/custom/profile-avatar-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  if (!id) notFound();

  const user = await prisma.user.findUnique({
    where: { id },
    include: { accounts: true },
  });

  if (!user) notFound();

  const session = await getSession();
  const isOwner = !!session && session.user.id === user.id;

  const providers = user.accounts.map((a) => a.providerId);
  const PROVIDER_LABELS: Record<string, string> = {
    google: "Google",
    github: "GitHub",
    credential: "Email & Password",
  };

  const PROVIDER_ICONS: Record<string, React.ReactNode> = {
    google: <FcGoogle />,
  };

  return (
    <div className="min-h-screen h-fit overflow-hidden flex flex-col">
      <Navbar />

      <main className="flex justify-center p-4">
        <div className="mx-auto w-full max-w-2xl flex flex-col gap-4">
          {/* Hero / Avatar Section */}
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            {/* Using the new Client Component here */}
            <ProfileAvatarClient
              userId={user.id}
              initialImage={user.image}
              userName={user.name}
              isOwner={isOwner}
            />

            <div className="flex flex-col items-center gap-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                {user.name}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold">Informasi Profil</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isOwner
                    ? "Kelola informasi akun Anda."
                    : "Informasi publik pengguna ini."}
                </p>

                <div className="mt-4 grid gap-2">
                  <div>
                    <h3 className="text-xs font-medium text-foreground/70">
                      Nama Lengkap
                    </h3>
                    <p className="text-sm font-medium text-foreground">
                      {user.name}
                    </p>
                  </div>

                  {isOwner && user.email && (
                    <div>
                      <h3 className="text-xs font-medium text-foreground/70">
                        Email
                      </h3>
                      <p className="text-sm font-medium text-foreground">
                        {user.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {isOwner && providers.length > 0 && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold">Metode Login</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Akun yang terhubung dengan profil Anda.
                  </p>

                  <div className="mt-4 flex flex-col gap-3">
                    {providers.map((provider) => (
                      <div
                        key={provider}
                        className="flex items-center gap-3 rounded-lg border bg-foreground/5 px-4 py-3"
                      >
                        {PROVIDER_ICONS[provider] ?? (
                          <div className="size-5 rounded-full bg-foreground/20" />
                        )}
                        <span className="text-sm font-medium text-foreground">
                          {PROVIDER_LABELS[provider] ?? provider}
                        </span>
                        <span className="ml-auto text-xs text-primary">
                          Terhubung
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
