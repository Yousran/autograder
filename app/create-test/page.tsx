"use client";
import { useState } from "react";
import { CreateQuestion } from "@/components/custom/create-question";
import Navbar from "@/components/custom/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Home() {
  const [questions, setQuestions] = useState<
    { id: number; text: string; type: "essay" | "multipleChoice"; choices: string[]; correctChoiceIndex: number | null; answerKey: string }[]
  >([{ id: 0, text: "", type: "multipleChoice", choices: [""], correctChoiceIndex: null, answerKey: "" }]);

  const addQuestion = () => {
    setQuestions([...questions, { id: questions.length, text: "", type: "multipleChoice", choices: [""], correctChoiceIndex: null, answerKey: "" }]);
  };

  const updateQuestion = (index: number, newData: Partial<typeof questions[0]>) => {
    setQuestions(questions.map((q, i) => (i === index ? { ...q, ...newData } : q)));
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col justify-center items-center gap-4 p-4">
        
        <Card className="w-full sm:w-2/5 p-4">
            <Input placeholder="Test Title" />
            <Button className="w-full mt-4">Create Test</Button>
        </Card>

        <Tabs defaultValue="question" className="w-full sm:w-2/5">
            <TabsList className="w-full flex">
                <TabsTrigger value="question" className="flex-1">Question</TabsTrigger>
                <TabsTrigger value="responses" className="flex-1">Responses</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="question">
                <CreateQuestion 
                    questions={questions} 
                    addQuestion={addQuestion} 
                    updateQuestion={updateQuestion}
                    removeQuestion={removeQuestion} 
                />
            </TabsContent>

            <TabsContent value="responses">
                <p className="p-4 text-gray-600">Responses content will be displayed here.</p>
            </TabsContent>

            <TabsContent value="settings">
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="accept_responses">Accept Responses</Label>
                        <Switch id="accept_responses"/>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <Label htmlFor="show_detailed_score">Show Detailed Score</Label>
                        <Switch id="show_detailed_score" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <Label htmlFor="is_ordered">Is Ordered</Label>
                        <Switch id="is_ordered" />
                    </div>
                </div>
            </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
