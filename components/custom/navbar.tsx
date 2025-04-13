// components/custom/navbar.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type DecodedToken = {
  userId: number;
  email: string;
  username: string;
  exp: number;
  iat: number;
};

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
  }, []);

  const handleLogout = () => {
    Cookies.remove("token");
    setIsLoggedIn(false);
    setInitial("U");
    setUsername("");
    toast.success("Logout Berhasil");
    router.push("/");
  };

  return (
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