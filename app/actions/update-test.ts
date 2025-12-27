// "use server";

// import { auth } from "@/lib/auth";
// import { PrismaClient } from "@/lib/generated/prisma/client";
// import { testSettingsSchema, TestSettingsValues } from "@/lib/validations/test";
// import { headers } from "next/headers";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { devLog } from "@/utils/devLog";

// const adapter = new PrismaPg({
//   connectionString: process.env.DATABASE_URL!,
// });

// const prisma = new PrismaClient({ adapter });

// export async function updateTestSettings(
//   testId: string,
//   data: TestSettingsValues
// ) {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });
//   if (!session) throw new Error("Unauthorized");

//   // Validate the data
//   const parsed = testSettingsSchema.safeParse(data);
//   if (!parsed.success) {
//     return { error: "Invalid data format" };
//   }

//   const { prerequisites, ...settingsData } = parsed.data;

//   try {
//     // Check if the user owns this test
//     const existingTest = await prisma.test.findUnique({
//       where: { id: testId },
//       select: { creatorId: true },
//     });

//     if (!existingTest) {
//       return { error: "Test not found" };
//     }

//     if (existingTest.creatorId !== session.user.id) {
//       return { error: "Unauthorized: You don't own this test" };
//     }

//     // Update test settings
//     await prisma.test.update({
//       where: { id: testId },
//       data: {
//         description: settingsData.description,
//         testDuration: settingsData.testDuration,
//         startTime: settingsData.startTime,
//         endTime: settingsData.endTime,
//         isAcceptingResponses: settingsData.isAcceptingResponses,
//         loggedInUserOnly: settingsData.loggedInUserOnly,
//         maxAttempts: settingsData.maxAttempts,
//         showDetailedScore: settingsData.showDetailedScore,
//         showCorrectAnswers: settingsData.showCorrectAnswers,
//         isQuestionsOrdered: settingsData.isQuestionsOrdered,
//       },
//     });

//     // Update prerequisites - delete existing and recreate
//     await prisma.testPrerequisite.deleteMany({
//       where: { testId },
//     });

//     if (prerequisites && prerequisites.length > 0) {
//       await prisma.testPrerequisite.createMany({
//         data: prerequisites.map((prereq) => ({
//           testId,
//           prerequisiteTestId: prereq.prerequisiteTestId,
//           minScoreRequired: prereq.minScoreRequired,
//         })),
//       });
//     }

//     return { success: true };
//   } catch (error) {
//     devLog(error);
//     return { error: "Failed to update test settings" };
//   }
// }
