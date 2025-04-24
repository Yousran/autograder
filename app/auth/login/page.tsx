<<<<<<< HEAD
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
=======
"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function Login() {
  const router = useRouter();
  const formSchema = z.object({
    email: z.string().email("Invalid email address."),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),
  });
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })
        .then((res) => {
          if (res.status === 200) {
            toast.success("Login successful!");
            router.push("/");
          } else {
            toast.error("Login failed. Please try again.");
          }
        })
        .catch((error) => {
          console.error(error);
          toast.error("An error occurred. Please try again.");
        });
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("An error occurred. Please try again.");
    }
    setIsLoading(false);
  }

  return (
    <div className="w-screen min-h-screen flex items-center justify-center">
      <Button
        variant="ghost"
        className="absolute top-4 left-4"
        onClick={() => {
          router.back();
        }}
      >
        <ArrowLeft />
      </Button>
      <Card className="w-full mx-4 max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardTitle className="text-center text-2xl font-bold">
              Login
            </CardTitle>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between mt-4">
              <Label className="text-sm">
                Don&apos;t have an account?{" "}
                <a
                  className="hover:underline cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push("/auth/register");
                  }}
                >
                  Register
                </a>
              </Label>
              <Button type="submit" disabled={isLoading}>
                Login
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
>>>>>>> baru/main
    </div>
  );
}
