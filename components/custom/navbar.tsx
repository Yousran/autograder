"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Ambil token & username dari localStorage
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");

    setIsAuthenticated(!!token);
    setUsername(storedUsername);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Hapus token
    localStorage.removeItem("username"); // Hapus username
    setIsAuthenticated(false);
    setUsername(null);
    router.push("/auth/login"); // Redirect ke login
  };

  return (
    <nav className="flex justify-between items-center p-4 shadow-sm bg-white">
      {/* Logo */}
      <div 
        className="text-xl font-bold cursor-pointer" 
        onClick={() => router.push("/")}
      >
        Autograder
      </div>

      {/* Profile Avatar / Login Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarImage src="#" alt="Profile Picture" />
            <AvatarFallback>{username ? username.charAt(0).toUpperCase() : "U"}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isAuthenticated ? (
            <>
              {/* ✅ Navigasi ke Profile berdasarkan Username */}
              <DropdownMenuItem onClick={() => router.push(`/profile/${username}`)}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={() => router.push("/auth/login")}>Login</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
