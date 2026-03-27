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
import { getInitials } from "@/lib/initials";
import { SettingsMenu } from "@/components/custom/settings-menu";

export default function Navbar() {
  const t = useTranslations("Components.navbar");
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const user = session?.user;
  const initials = getInitials(session?.user?.name);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card backdrop-blur supports-backdrop-filter:bg-card/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg"
        >
          Autograder
        </Link>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          {/* Settings */}
          <TooltipProvider>
            <SettingsMenu />
          </TooltipProvider>

          <TooltipProvider>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-full p-0 focus-visible:ring-2"
                      data-testid="btn-user-menu"
                    >
                      <Avatar>
                        <AvatarImage
                          src={session?.user?.image ?? undefined}
                          alt={session?.user?.name ?? "User avatar"}
                        />
                        <AvatarFallback>{initials ?? <User />}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {user ? user.name : t("account")}
                </TooltipContent>
              </Tooltip>

              <DropdownMenuContent align="end">
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
                        data-testid="link-profile"
                      >
                        <Avatar>
                          <AvatarImage
                            src={session?.user?.image ?? undefined}
                            alt={session?.user?.name ?? "User avatar"}
                          />
                          <AvatarFallback>
                            {initials ?? <User />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {user.name}
                          </span>
                          {user.email && (
                            <span className="text-[0.6rem] text-muted-foreground">
                              {user.email}
                            </span>
                          )}
                        </div>
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
      </div>
    </header>
  );
}
