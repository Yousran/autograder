// app/auth/login/page.tsx

"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    setIsLoading(true);
    const res = await fetch("/api/v1/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      document.cookie = `token=${data.token}; path=/`;
      toast.success("Login berhasil!", {
        description: "Selamat datang kembali",
      });
      router.push("/");
    } else {
      toast.error("Login gagal", {
        description: data.message,
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md p-6 space-y-4 border rounded-lg shadow">
        <h2 className="text-xl font-bold text-center">Login</h2>
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
        <div className="w-full flex items-center justify-center gap-4">
          <Button variant={"secondary"} className="w-fit" onClick={() => router.push("/")}>
            Back
          </Button>
            <Button className="w-fit" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "Loading..." : "Login"}
            </Button>
        </div>
        <p className="text-center text-sm">
          Dont have an account?{" "}
          <Link href="/auth/register" className="text-blue-600">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
