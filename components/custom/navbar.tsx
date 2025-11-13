"use client";
import { useRouter, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const pathname = usePathname();

  const user = session?.user;
  const isLoggedIn = !!user;

  const handleLogout = async () => {
    await signOut();
    toast.success("Logout Successful");
    router.push("/");
  };

  return (
    <nav className="w-full flex items-center justify-between p-4 shadow-sm bg-card text-foreground">
      {pathname.startsWith("/participant/") ||
      pathname.match(/^\/test\/[^/]+\/edit$/) ? (
        <Button size={"icon"} variant="ghost" onClick={() => router.back()}>
          <ArrowLeftIcon />
        </Button>
      ) : (
        <Label
          className="text-2xl font-bold cursor-pointer"
          onClick={() => router.push("/")}
        >
          Autograde
        </Label>
      )}
      <div className="flex space-x-4">
        {isLoggedIn && pathname !== "/test/create" && (
          <Button onClick={() => router.push("/test/create")}>Make Test</Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer">
              <AvatarImage src={user?.image || undefined} />
              <AvatarFallback className="text-foreground">
                {user
                  ? (user.name || user.email || "U").charAt(0).toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {isLoggedIn ? (
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/profile/${user?.name || user?.email}`)
                }
              >
                Profile
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Settings
            </DropdownMenuItem>
            {isLoggedIn ? (
              <DropdownMenuItem onClick={() => handleLogout()}>
                Logout
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onClick={() => router.push("/auth/register")}>
                  Register
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/auth/login")}>
                  Login
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
