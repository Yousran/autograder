// file: app/test/create/page.tsx

// TODO: choice question card
// TODO: max score
// TODO: choice randomized
// TODO: multiple choice question card

"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Navbar from "@/components/custom/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CardQuestion } from "./components/card-question";
import { Question } from "@/types/question";
import { useState } from "react";
import { PlusIcon } from "lucide-react";

// Schema validasi pakai zod
const testSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  duration: z
    .number({ invalid_type_error: "Duration must be a number" })
    .min(1, { message: "Minimum 1 minute" }),
});

type TestFormValues = z.infer<typeof testSchema>;

const defaultQuestion: Question = {
  id: crypto.randomUUID(),
  testId: "",
  type: "ESSAY",
  questionText: "",
  order: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function TestCreatePage() {
  const [questions, setQuestions] = useState<Question[]>([defaultQuestion]);
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: "",
      duration: 30,
    },
  });

  const onSubmit = (data: TestFormValues) => {
    console.log("Form submitted", data);
    console.log("Question submitted", questions);
    // TODO: handle API call to create test
  };

  // Fungsi untuk menyisipkan pertanyaan baru
  const insertQuestion = (insertIndex: number) => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      testId: "",
      type: "ESSAY",
      questionText: "",
      order: insertIndex + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedQuestions = [...questions];
    updatedQuestions.splice(insertIndex, 0, newQuestion);

    // Update urutan pertanyaan
    updatedQuestions.forEach((q, index) => {
      q.order = index + 1;
    });

    setQuestions(updatedQuestions);
  };

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex justify-center items-start p-4">
        <div className="w-full max-w-2xl flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-center">
                Create Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter test title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    Create Test
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <div id="questions" className="flex flex-col gap-4">
            {questions.map((question, index) => (
              <div key={question.id} className="flex flex-col gap-4">
                <CardQuestion
                  question={question}
                  questions={questions}
                  setQuestions={setQuestions}
                />

                {/* Tombol tambah di antara pertanyaan */}
                <Button
                  className="w-full bg-secondary md:h-2 md:bg-secondary md:dark:bg-card md:hover:h-12 md:hover:bg-primary md:hover:dark:bg-primary "
                  onClick={() => insertQuestion(index + 1)}
                >
                  <PlusIcon className="h-12 w-12 stroke-4 stroke-accent-foreground md:stroke-accent" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
