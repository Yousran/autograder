<<<<<<< HEAD
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    setIsLoading(true);
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
        <Button className="w-full" onClick={handleRegister} disabled={isLoading}>
          {isLoading ? "Registering..." : "Register"}
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
import { useState } from "react";

export default function Register() {
  const router = useRouter();
  const formSchema = z
    .object({
      username: z.string().min(3, {
        message: "Username must be at least 3 characters.",
      }),
      email: z.string().email("Invalid email address."),
      password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters." }),
      confirmPassword: z
        .string()
        .min(8, { message: "Password must be at least 8 characters." }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      fetch("/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })
        .then((res) => {
          if (res.status === 201) {
            toast.success("Registration successful!");
            router.push("/auth/login");
          } else {
            toast.error("Registration failed. Please try again.");
          }
        })
        .catch((error) => {
          console.error(error);
          toast.error("An error occurred. Please try again.");
          setIsLoading(false);
        });
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
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
              Register
            </CardTitle>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Confirm Password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end mt-4">
              <Button type="submit" disabled={isLoading}>
                Register
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
>>>>>>> baru/main
