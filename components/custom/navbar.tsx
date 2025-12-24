"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getInitial } from "@/lib/text";

export default function Navbar() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <nav className="w-full flex items-center justify-between p-4 shadow-sm bg-card text-foreground">
      <Label
        className="text-2xl font-bold cursor-pointer"
        onClick={() => router.push("/")}
      >
        {APP_NAME}
      </Label>

      <div className="flex items-center space-x-4">
        {user && (
          <Button onClick={() => router.push("/test/create")}>Make Test</Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer">
              <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
              <AvatarFallback className="text-foreground">
                {getInitial(user?.name)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {user ? (
              <>
                <DropdownMenuItem
                  onClick={() => router.push(`/profile/${user.name}`)}
                >
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => router.push("/auth/signin")}>
                  Sign In
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/auth/signup")}>
                  Sign Up
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
