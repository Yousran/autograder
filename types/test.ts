export type Test = {
  id: string;
  creatorId: string;
  title: string;
  joinCode: string;
  description?: string;
  testDuration?: number;
  startTime?: Date;
  endTime?: Date;
  acceptResponses: boolean;
  showDetailedScore: boolean;
  showCorrectAnswers: boolean;
  isOrdered: boolean;
  createdAt: Date;
  updatedAt: Date;
};
