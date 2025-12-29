"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebouncedCallback } from "use-debounce";
import { useCallback, useRef } from "react";

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
import { toast } from "sonner";
import { useSyncTracker } from "../context/optimistic-context";

export function TestSettings({ test }: { test: Test }) {
  const { trackSync } = useSyncTracker();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastSavedRef = useRef<Record<string, any>>({});

  // 1. Initialize Form with Default Values from the DB 'test' object
  const form = useForm({
    resolver: zodResolver(testSchema),
    defaultValues: {
      description: test.description || undefined,
      testDuration: test.testDuration,
      maxAttempts: test.maxAttempts,
      isAcceptingResponses: test.isAcceptingResponses,
      loggedInUserOnly: test.loggedInUserOnly,
      showDetailedScore: test.showDetailedScore,
      showCorrectAnswers: test.showCorrectAnswers,
      isQuestionsOrdered: test.isQuestionsOrdered,
    },
    mode: "onChange",
  });

  // 2. The Central Save Handler with global sync tracking
  const handleSave = useCallback(
    async (field: keyof TestValidation, value: unknown) => {
      const data = { [field]: value } as Partial<TestValidation>;

      // Skip if value hasn't changed
      if (lastSavedRef.current[field] === value) {
        return;
      }

      // Track with global sync
      await trackSync(
        `setting-${field}`,
        async () => {
          const result = await editTest(test.id, data);
          if (result.success) {
            // Update last saved value
            lastSavedRef.current[field] = value;
          } else {
            toast.error(`Failed to save: ${result.error}`);
          }
          return result;
        },
        `Saving ${field}...`
      );
    },
    [test.id, trackSync]
  );

  // 3. Debouncer for Text/Number Inputs (1s delay for debounce, immediate UI update)
  const debouncedSave = useDebouncedCallback(
    (field: keyof TestValidation, value: unknown) => {
      handleSave(field, value);
    },
    1000
  );

  // Immediate save for switches (but still async)
  const immediateSave = useCallback(
    (field: keyof TestValidation, value: unknown) => {
      handleSave(field, value);
    },
    [handleSave]
  );

  return (
    <Form {...form}>
      <Card>
        <CardHeader>
          <CardTitle>Test Settings</CardTitle>
          <CardDescription>All changes are saved automatically</CardDescription>
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
                      // Immediate UI update (optimistic)
                      field.onChange(e);
                      // Debounced server sync
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
                    {...field}
                    value={(field.value ?? "") as string | number}
                    onChange={(e) => {
                      const val =
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value);

                      // Immediate UI update (optimistic)
                      field.onChange(val);

                      // Debounced server sync (only if valid)
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

                      // Immediate UI update (optimistic)
                      field.onChange(val);

                      // Debounced server sync (only if valid)
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

          {/* --- SWITCHES (Immediate UI Update, Async Save) --- */}

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
                      // Immediate UI update (optimistic)
                      field.onChange(checked);
                      // Async server sync
                      immediateSave("isAcceptingResponses", checked);
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
                      // Immediate UI update (optimistic)
                      field.onChange(checked);
                      // Async server sync
                      immediateSave("loggedInUserOnly", checked);
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
                      // Immediate UI update (optimistic)
                      field.onChange(checked);
                      // Async server sync
                      immediateSave("showDetailedScore", checked);
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
                      // Immediate UI update (optimistic)
                      field.onChange(checked);
                      // Async server sync
                      immediateSave("showCorrectAnswers", checked);
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
                      // Immediate UI update (optimistic)
                      field.onChange(checked);
                      // Async server sync
                      immediateSave("isQuestionsOrdered", checked);
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
