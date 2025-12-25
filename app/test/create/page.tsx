"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/custom/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionsBuilder } from "./components/questions-builder";
import { TestSettings } from "@/components/custom/test-settings";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { testFormSchema, TestFormValues } from "@/lib/validations/test";
import { createTest } from "@/app/actions/create-test";
import { QuestionType } from "@/lib/generated/prisma/enums";
import { Label } from "@/components/ui/label";

export default function TestCreatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      title: "",
      description: "",
      testDuration: 30,
      isAcceptingResponses: true,
      loggedInUserOnly: false,
      maxAttempts: 1,
      showDetailedScore: true,
      showCorrectAnswers: false,
      isQuestionsOrdered: false,
      prerequisites: [],
      questions: [
        {
          type: QuestionType.ESSAY,
          questionText: "",
          order: 0,
          exactAnswer: false,
          answerText: "",
          maxScore: 5,
        },
      ],
    },
  });

  async function onSubmit(data: TestFormValues) {
    setIsLoading(true);
    try {
      const result = await createTest(data);

      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      toast.success("Test created successfully!");
      if (result.joinCode) {
        router.push(`/test/${result.joinCode}/edit`);
      }
    } catch (error) {
      console.error("Error creating test:", error);
      toast.error("Failed to create test");
      setIsLoading(false);
    }
  }

  return (
    <FormProvider {...form}>
      <div className="max-w-screen min-h-screen flex flex-col">
        <Navbar />
        <main className="grow flex justify-center items-start p-4">
          <div className="w-full max-w-2xl flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-semibold text-center">
                  Create Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="title" className="font-medium">
                      Test Title
                    </Label>
                    <Input
                      id="title"
                      {...form.register("title")}
                      placeholder="Enter test title"
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.title.message}
                      </p>
                    )}
                  </div>

                  <AlertDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        className="w-full"
                        disabled={isLoading}
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          const isValid = await form.trigger();
                          if (!isValid) {
                            toast.error(
                              "Please fix validation errors before creating test"
                            );
                            console.log("Form errors:", form.formState.errors);
                          } else {
                            setIsDialogOpen(true);
                          }
                        }}
                      >
                        {isLoading ? "Creating..." : "Create Test"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Create Test</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to create this test? Make sure
                          all questions are properly configured.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async (e) => {
                            e.preventDefault();
                            setIsDialogOpen(false);
                            await form.handleSubmit(onSubmit)();
                          }}
                          disabled={isLoading}
                        >
                          {isLoading ? "Creating..." : "Create Test"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </form>
              </CardContent>
            </Card>

            <Tabs defaultValue="questions" className="w-full gap-4">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="questions">Questions</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="questions">
                <QuestionsBuilder />
              </TabsContent>

              <TabsContent value="settings">
                <TestSettings />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </FormProvider>
  );
}
