"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebouncedCallback } from "use-debounce";
import { useTransition } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { TestValidation, testSchema } from "@/lib/validations/test";
import { Test } from "@/lib/generated/prisma/client";
import { editTest } from "@/app/actions/test/edit";

export function TestSettings({ test }: { test: Test }) {
  const [isPending, startTransition] = useTransition();

  // 1. Initialize Form with Default Values from the DB 'test' object
  const form = useForm({
    resolver: zodResolver(testSchema),
    defaultValues: {
      description: test.description || undefined,
      testDuration: test.testDuration || undefined,
      maxAttempts: test.maxAttempts || undefined,
      isAcceptingResponses: test.isAcceptingResponses,
      loggedInUserOnly: test.loggedInUserOnly,
      showDetailedScore: test.showDetailedScore,
      showCorrectAnswers: test.showCorrectAnswers,
      isQuestionsOrdered: test.isQuestionsOrdered,
    },
    mode: "onChange",
  });

  // 2. The Central Save Handler
  const handleSave = (data: Partial<TestValidation>) => {
    startTransition(async () => {
      const result = await editTest(test.id, data);

      if (!result.success) {
        console.error(result.error);
      }
    });
  };

  // 3. Debouncer for Text/Number Inputs (500ms delay)
  const debouncedSave = useDebouncedCallback(
    (field: keyof TestValidation, value: unknown) => {
      handleSave({ [field]: value });
    },
    1000
  );

  return (
    <Form {...form}>
      <Card>
        <CardHeader>
          <CardTitle>Test Settings</CardTitle>
          <CardDescription>
            {isPending ? "Saving changes..." : "All changes saved"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* --- TEXT AREA: Description --- */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Description of the test"
                    className="resize-none"
                    maxLength={500}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      debouncedSave("description", e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* --- NUMBER INPUT: Test Duration --- */}
          <FormField
            control={form.control}
            name="testDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Test Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="30"
                    min={1}
                    // 1. Spread field props (onBlur, name, ref)
                    {...field}
                    // 2. FIX: Safely handle the value.
                    // If it's null/undefined, render empty string ""
                    value={(field.value ?? "") as string | number}
                    // 3. Handle change manually to ensure it's treated as a number
                    onChange={(e) => {
                      const val =
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value);

                      // Update RHF internal state
                      field.onChange(val);

                      // Auto-save logic
                      const isValid =
                        !form.getFieldState("testDuration").invalid;
                      if (isValid) debouncedSave("testDuration", val);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* --- NUMBER INPUT: Max Attempts --- */}
          <FormField
            control={form.control}
            name="maxAttempts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Attempts</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Leave empty for unlimited"
                    min={1}
                    {...field}
                    value={(field.value ?? "") as string | number}
                    onChange={(e) => {
                      const val =
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value);

                      // Update RHF internal state
                      field.onChange(val);

                      // Auto-save logic
                      const isValid =
                        !form.getFieldState("maxAttempts").invalid;
                      if (isValid) debouncedSave("maxAttempts", val);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* --- SWITCHES (Immediate Save) --- */}

          <FormField
            control={form.control}
            name="isAcceptingResponses"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <FormLabel className="text-base">Accept Responses</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      handleSave({ isAcceptingResponses: checked });
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="loggedInUserOnly"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <FormLabel className="text-base">
                  Only Allow Logged In User
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      handleSave({ loggedInUserOnly: checked });
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showDetailedScore"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <FormLabel className="text-base">Show Detailed Score</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      handleSave({ showDetailedScore: checked });
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showCorrectAnswers"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <FormLabel className="text-base">
                  Show Correct Answers
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      handleSave({ showCorrectAnswers: checked });
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isQuestionsOrdered"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <FormLabel className="text-base">
                  Is Questions Ordered
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      handleSave({ isQuestionsOrdered: checked });
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </Form>
  );
}
