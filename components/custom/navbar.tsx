"use client";

import { useTranslations } from "next-intl";
import { LogIn, LogOut, UserPlus, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

export default function Navbar() {
  const t = useTranslations("Navbar");
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const user = session?.user;

  /** Derive initials from the user's name, e.g. "John Doe" → "JD" */
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : undefined;

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg"
        >
          Autograder
        </Link>

        {/* Avatar + Dropdown */}
        <TooltipProvider>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <Avatar>
                      <AvatarImage
                        src={user?.image ?? ""}
                        alt={user?.name ?? "User avatar"}
                      />
                      <AvatarFallback>
                        {initials ?? <User className="size-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {user ? user.name : t("account")}
              </TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="end" className="w-48">
              {!user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/auth/sign-in"
                      className="flex items-center gap-2"
                    >
                      <LogIn className="size-4" />
                      {t("signIn")}
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/auth/sign-up"
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="size-4" />
                      {t("signUp")}
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/profile/${user.id}`}
                      className="flex items-center gap-2"
                    >
                      <User className="size-4" />
                      {t("profile")}
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                    onSelect={handleSignOut}
                  >
                    <LogOut className="size-4" />
                    {t("logout")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
      </div>
    </header>
  );
}
