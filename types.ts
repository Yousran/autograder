// types.ts
export type BaseQuestion = {
    id: number;
    type: 'essay' | 'choice';
  };
  
export type EssayQuestion = BaseQuestion & {
type: 'essay';
question: string;
answerKey: string;
};

export type Choice = {
id: number;
text: string;
isCorrect: boolean;
};

export type ChoiceQuestion = BaseQuestion & {
type: 'choice';
question: string;
choices: Choice[];
};

export type Question = EssayQuestion | ChoiceQuestion;