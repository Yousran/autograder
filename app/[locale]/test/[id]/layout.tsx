import { redirect } from "@/i18n/navigation";
import { requireTestCreator } from "@/lib/dal";
import { getLocale } from "next-intl/server";

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function TestLayout({ children, params }: Props) {
  const [{ id }, locale] = await Promise.all([params, getLocale()]);

  const result = await requireTestCreator(id);

  if (!result.ok) {
    redirect({
      href: result.reason === "unauthenticated" ? "/auth/sign-in" : "/",
      locale,
    });
  }

  return <>{children}</>;
}
