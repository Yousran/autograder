"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignInInput) {
    try {
      setIsLoading(true);

      const response = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (response.error) {
        toast.error(response.error.message || "Sign in failed");
        return;
      }

      toast.success("Signed in successfully! Redirecting...");
      router.push("/");
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithGoogle() {
    try {
      setIsLoading(true);
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (error) {
      toast.error("Google sign in failed");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={signInWithGoogle}
              disabled={isLoading}
            >
              <FcGoogle className="mr-2" /> Continue with Google
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        disabled={isLoading}
                        {...field}
                      />
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
                        type="password"
                        placeholder="••••••••"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 space-y-2">
            <div className="text-center text-sm">
              {"Don't have an account? "}
              <Link
                href="/auth/signup"
                className="text-primary hover:underline font-medium"
              >
                Sign Up
              </Link>
            </div>
            <div className="text-center text-sm">
              <Link
                href="#"
                className="text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
