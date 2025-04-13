// app/auth/register/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    const res = await fetch("/api/v1/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("Registrasi berhasil!", {
        description: "Silakan login dengan akun kamu.",
      });

      setTimeout(() => {
        router.push("/auth/login");
      }, 1200); // Kasih delay biar toast sempat muncul
    } else {
      toast.error("Registrasi gagal", {
        description: data.message || "Terjadi kesalahan saat registrasi.",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md p-6 space-y-4 border rounded-lg shadow">
        <h2 className="text-xl font-bold text-center">Register</h2>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>
        <Button className="w-full" onClick={handleRegister}>
          Register
        </Button>
        <p className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-600">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}