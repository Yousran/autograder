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
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
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
        });
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    }
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
              <Button type="submit">Register</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
