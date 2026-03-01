import { notFound } from "next/navigation";
import Navbar from "@/components/custom/navbar";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/dal";
import { getLocale, getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import ProfileAvatarClient from "@/components/custom/profile-avatar-client";
import { MdEmail } from "react-icons/md";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import DeleteAccountButton from "@/components/custom/delete-account-button";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  if (!id) notFound();

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      accounts: true,
      tests: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) notFound();

  const session = await getSession();
  const isOwner = !!session && session.user.id === user.id;

  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Pages.profile" });

  const providers = user.accounts.map((a) => a.providerId);
  const PROVIDER_LABELS: Record<string, string> = {
    credential: "Email & Password",
    google: "Google",
    github: "GitHub",
  };

  const PROVIDER_ICONS: Record<string, React.ReactNode> = {
    credential: <MdEmail />,
    google: <FcGoogle />,
    github: <FaGithub />,
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
              <CardContent>
                <h2 className="text-lg font-semibold">
                  {t("profileInformation")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isOwner ? t("manageInfo") : t("publicInfo")}
                </p>

                <div className="mt-4 grid gap-2">
                  <div>
                    <h3 className="text-xs font-medium text-foreground/70">
                      {t("fullName")}
                    </h3>
                    <p className="text-sm font-medium text-foreground">
                      {user.name}
                    </p>
                  </div>

                  {isOwner && user.email && (
                    <div>
                      <h3 className="text-xs font-medium text-foreground/70">
                        {t("email")}
                      </h3>
                      <p className="text-sm font-medium text-foreground">
                        {user.email}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {isOwner && (
              <Card>
                <CardContent>
                  <h2 className="text-lg font-semibold">{t("createdTests")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("createdTestsDescription")}
                  </p>

                  <div className="mt-4 flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                    {user.tests.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("noTests")}
                      </p>
                    ) : (
                      user.tests.map((test) => (
                        <Link
                          key={test.id}
                          href={`/test/${test.id}`}
                          className="flex flex-col rounded-lg border bg-foreground/5 px-4 py-3 hover:bg-foreground/10 transition-colors"
                        >
                          <span className="text-sm font-medium text-foreground line-clamp-1">
                            {test.title}
                          </span>
                          {test.description && (
                            <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {test.description}
                            </span>
                          )}
                        </Link>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {isOwner && PROVIDER_LABELS && (
              <Card>
                <CardContent>
                  <h3 className="text-lg font-semibold">{t("loginMethods")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("connectedAccounts")}
                  </p>

                  <div className="mt-4 flex flex-col gap-3">
                    {Object.keys(PROVIDER_LABELS).map((provider) => (
                      <div
                        key={provider}
                        className="flex items-center gap-3 rounded-lg border bg-foreground/5 px-4 py-3"
                      >
                        {PROVIDER_ICONS[provider] ?? (
                          <div className="size-5 rounded-full bg-foreground/20" />
                        )}
                        <Label>{PROVIDER_LABELS[provider] ?? provider}</Label>
                        {providers.includes(provider) && (
                          <Badge
                            variant="outline"
                            className="ml-auto border-green-500 text-green-500"
                          >
                            {t("connected")}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {isOwner && (
              <Card className="border-destructive/50">
                <CardContent>
                  <h3 className="text-lg font-semibold text-destructive">
                    {t("deleteAccount")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("deleteAccountDescription")}
                  </p>
                  <div className="mt-4">
                    <DeleteAccountButton userId={user.id} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
