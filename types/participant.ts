export type Participant = {
  id: string;
  testId: string;
  userId?: string;
  username: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
};
