import { notFound } from "next/navigation";
import Navbar from "@/components/custom/navbar";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/dal";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import ProfileAvatarClient from "@/components/custom/profile-avatar-client";
import { MdEmail } from "react-icons/md";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import DeleteAccountButton from "@/components/custom/delete-account-button";
import { GaugeCombined } from "@/components/ui/gauge";
import { LLMModelCard } from "./components/llm-model-card";
import type { Participant, Test } from "@/lib/generated/prisma/client";

type ParticipantWithTest = Participant & { test: Test };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations();
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

  // Fetch tests taken by user if viewing own profile
  let takenTests: ParticipantWithTest[] = [];
  if (isOwner && session) {
    takenTests = await prisma.participant.findMany({
      where: { userId: session.user.id },
      include: { test: true },
      orderBy: { createdAt: "desc" },
    });
  }

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
              <h1
                className="text-3xl font-extrabold tracking-tight text-foreground"
                data-testid="profile-name"
              >
                {user.name}
              </h1>
              <p
                className="text-sm text-muted-foreground"
                data-testid="profile-email"
              >
                {user.email}
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardContent>
                <h2
                  className="text-lg font-semibold"
                  data-testid="profile-info-section"
                >
                  {t("Pages.profile.profileInformation")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isOwner
                    ? t("Pages.profile.manageInfo")
                    : t("Pages.profile.publicInfo")}
                </p>

                <div className="mt-4 grid gap-2">
                  <div>
                    <h3 className="text-xs font-medium text-foreground/70">
                      {t("Pages.profile.fullName")}
                    </h3>
                    <p className="text-sm font-medium text-foreground">
                      {user.name}
                    </p>
                  </div>

                  {isOwner && user.email && (
                    <div>
                      <h3 className="text-xs font-medium text-foreground/70">
                        {t("Pages.profile.email")}
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
                  <h2
                    className="text-lg font-semibold"
                    data-testid="profile-created-tests-section"
                  >
                    {t("Pages.profile.createdTests")}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("Pages.profile.createdTestsDescription")}
                  </p>

                  <div className="mt-4 flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                    {user.tests.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("Pages.profile.noTests")}
                      </p>
                    ) : (
                      user.tests.map((test) => (
                        <Link
                          key={test.id}
                          href={`/test/${test.id}`}
                          className="flex flex-col rounded-lg border bg-foreground/5 p-4 hover:bg-foreground/10 transition-colors"
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

            {isOwner && takenTests.length > 0 && (
              <Card>
                <CardContent>
                  <h2
                    className="text-lg font-semibold"
                    data-testid="profile-tests-taken-section"
                  >
                    {t("Pages.profile.testsTaken")}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("Pages.profile.testsTakenDescription")}
                  </p>

                  <div className="mt-4 flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                    {takenTests.map((participant) => (
                      <Link
                        key={participant.id}
                        href={`/test/result/${participant.id}`}
                        className="flex items-center gap-4 p-4 rounded-lg border bg-foreground/5 hover:bg-foreground/10 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground line-clamp-1 block">
                            {participant.test.title}
                          </span>
                          {participant.test.description && (
                            <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1 block">
                              {participant.test.description}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <GaugeCombined
                            value={participant.score}
                            max={100}
                            min={0}
                            size={50}
                            thickness={4}
                          />
                          <Badge
                            variant={
                              participant.isCompleted ? "default" : "secondary"
                            }
                            className="w-fit text-xs"
                          >
                            {participant.isCompleted
                              ? t("Components.participantsTab.completed")
                              : t("Components.participantsTab.inProgress")}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {isOwner && (
              <Card>
                <CardContent>
                  <h3
                    className="text-lg font-semibold"
                    data-testid="profile-login-methods-section"
                  >
                    {t("Pages.profile.loginMethods")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("Pages.profile.connectedAccounts")}
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
                            {t("Pages.profile.connected")}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {isOwner && (
              <Card>
                <CardContent>
                  <h2
                    className="text-lg font-semibold"
                    data-testid="profile-llm-models-section"
                  >
                    {t("Pages.profile.llmModels")}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("Pages.profile.llmModelsDescription")}
                  </p>

                  <div className="mt-4">
                    <LLMModelCard />
                  </div>
                </CardContent>
              </Card>
            )}

            {isOwner && (
              <Card className="border-destructive/50">
                <CardContent>
                  <h3
                    className="text-lg font-semibold text-destructive"
                    data-testid="profile-delete-account-section"
                  >
                    {t("Pages.profile.deleteAccount")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("Pages.profile.deleteAccountDescription")}
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
