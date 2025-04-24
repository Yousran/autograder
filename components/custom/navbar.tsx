<<<<<<< HEAD
// components/custom/navbar.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
=======
"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
>>>>>>> baru/main
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
<<<<<<< HEAD
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type DecodedToken = {
  userId: number;
  email: string;
  username: string;
  exp: number;
  iat: number;
};
=======
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getUserDecodedToken } from "@/lib/auth-client";
import { UserDecodedToken } from "@/types/token";
import { Label } from "../ui/label";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
>>>>>>> baru/main

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
<<<<<<< HEAD
  const [initial, setInitial] = useState("U");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setIsLoggedIn(true);
        if (decoded.username) {
          setInitial(decoded.username.charAt(0).toUpperCase());
          setUsername(decoded.username);
        }
      } catch (error) {
        console.error("Invalid token", error);
        Cookies.remove("token");
        setIsLoggedIn(false);
        setInitial("U");
        setUsername("");
      }
    }
=======
  const [user, setUser] = useState<UserDecodedToken | null>();
  const pathname = usePathname();

  useEffect(() => {
    const decoded = getUserDecodedToken();
    setUser(decoded);
    setIsLoggedIn(!!decoded);
>>>>>>> baru/main
  }, []);

  const handleLogout = () => {
    Cookies.remove("token");
<<<<<<< HEAD
    setIsLoggedIn(false);
    setInitial("U");
    setUsername("");
=======
    setUser(null);
    setIsLoggedIn(false);
>>>>>>> baru/main
    toast.success("Logout Berhasil");
    router.push("/");
  };

  return (
<<<<<<< HEAD
    <nav className="flex justify-between items-center p-4 shadow-sm bg-white fixed top-0 left-0 w-full z-10">
      <div
        className="text-2xl font-bold cursor-pointer"
        onClick={() => router.push("/")}
      >
        Autograder
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarImage src="#" alt="Profile Picture" />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isLoggedIn ? (
            <>
              <DropdownMenuItem onClick={() => router.push(`/profile/${username}`)}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/test/create")}>
                Create Test
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={() => router.push("/auth/login")}>
              Login
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
=======
    <nav className="w-full flex items-center justify-between p-4 shadow-sm bg-card text-foreground">
      <Label
        className="text-2xl font-bold cursor-pointer"
        onClick={() => router.push("/")}
      >
        Autograde
      </Label>
      <div className="flex space-x-4">
        {isLoggedIn && pathname !== "/test/create" && (
          <Button onClick={() => router.push("/test/create")}>Make Test</Button>
        )}
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
            {isLoggedIn ? (
              <DropdownMenuItem
                onClick={() => router.push(`/profile/${user?.username}`)}
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
>>>>>>> baru/main
