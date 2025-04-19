"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getDecodedToken } from "@/lib/auth-client";
import { DecodedToken } from "@/types/token";
import { Label } from "../ui/label";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Button } from "../ui/button";

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<DecodedToken | null>();

  useEffect(() => {
    const decoded = getDecodedToken();
    setUser(decoded);
    setIsLoggedIn(!!decoded);
  }, []);

  const handleLogout = () => {
    Cookies.remove("token");
    setUser(null);
    setIsLoggedIn(false);
    toast.success("Logout Berhasil");
    router.push("/");
  };

  return (
    <nav className="flex items-center justify-between p-4 shadow-sm bg-card text-foreground">
      <Label
        className="text-2xl font-bold cursor-pointer"
        onClick={() => router.push("/")}
      >
        Autograde
      </Label>
      <div className="flex space-x-4">
        {isLoggedIn ? (
          <Button onClick={() => router.push("/test/create")}>Make Test</Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer">
              <AvatarImage />
              <AvatarFallback className="text-foreground">
                {user ? user.username.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {isLoggedIn ? <DropdownMenuItem>Profile</DropdownMenuItem> : null}
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Settings
            </DropdownMenuItem>
            {isLoggedIn ? (
              <DropdownMenuItem onClick={() => handleLogout()}>
                Logout
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => router.push("/auth/login")}>
                Login
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
