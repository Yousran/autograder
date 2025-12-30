import {
  ParticipantValidation,
  ParticipantJoinValidation,
  participantSchema,
  participantJoinSchema,
} from "@/lib/validations/participant";

// Re-export validation types and schemas
export {
  participantSchema,
  participantJoinSchema,
  type ParticipantValidation,
  type ParticipantJoinValidation,
};

// Complete Participant type matching Prisma schema
export interface Participant {
  id: string;
  testId: string;
  userId: string | null;
  name: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

// Participant with test details
export interface ParticipantWithTest extends Participant {
  test: {
    id: string;
    title: string;
    joinCode: string;
    description: string | null;
    testDuration: number | null;
    startTime: Date | null;
    endTime: Date | null;
    isAcceptingResponses: boolean;
    loggedInUserOnly: boolean;
    maxAttempts: number | null;
    showDetailedScore: boolean;
    showCorrectAnswers: boolean;
    isQuestionsOrdered: boolean;
    creatorId: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

// Participant with user details
export interface ParticipantWithUser extends Participant {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
}

// Participant with full details (test, user, and answer counts)
export interface ParticipantWithDetails extends ParticipantWithTest {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
  _count?: {
    essayAnswers: number;
    choiceAnswers: number;
    multipleSelectAnswers: number;
  };
}

// Leaderboard entry type
export interface LeaderboardEntry {
  participantId: string;
  name: string;
  score: number;
  userId: string | null;
  userImage: string | null;
  completedAt: Date;
  rank: number;
}
