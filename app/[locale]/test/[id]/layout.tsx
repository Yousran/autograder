import { redirect } from "@/i18n/navigation";
import { requireTestCreator } from "@/lib/dal";
import { getLocale } from "next-intl/server";
import { SyncProvider } from "./context/sync-context";

export default async function TestLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const [{ id }, locale] = await Promise.all([params, getLocale()]);

  const result = await requireTestCreator(id);

  if (!result.ok) {
    redirect({
      href: result.reason === "unauthenticated" ? "/auth/sign-in" : "/",
      locale,
    });
  }

  return <SyncProvider>{children}</SyncProvider>;
}
