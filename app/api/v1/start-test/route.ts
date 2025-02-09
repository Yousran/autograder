//api/v1/start-test/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/middleware/auth";

export async function POST(req: Request) {
  console.log("Incoming request body:", req);
  const body = await req.json();
  console.log("Parsed body:", body);

  const user = authenticate(req);
  console.log("Authenticated user:", user);
  
  const { username, joinCode, startTime } = body;
  console.log("Extracted values:", {
    username,
    joinCode,
    startTime
  });

  if (!joinCode || !startTime){
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const test = await prisma.test.findUnique({
    where: { join_code: joinCode },
    select: { id: true }
  });

  if (!test){
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  let existingParticipant;
  let newParticipant;

  // Check for existing participant
  if (user) {
    existingParticipant = await prisma.participant.findFirst({
      where: {
        test_id: test.id,
        user_id: user.id
      }
    });
  } else {
    existingParticipant = await prisma.participant.findFirst({
      where: {
        test_id: test.id,
        username: username
      }
    });
  }

  // If participant exists, use existing data
  if (existingParticipant) {
    newParticipant = existingParticipant;
  } 
  // If no existing participant, create new one
  else {
    if (user) {
      const userr = await prisma.user.findUnique({
        where: { id: user.id },
        select: { username: true }
      });
      if (userr) {
        newParticipant = await prisma.participant.create({
          data: {
            test_id: test.id,
            user_id: user.id,
            username: userr.username,
            start_time: new Date(startTime),
          }
        }); 
      }
    } else {
      console.log("User not found, creating participant without user_id");
      newParticipant = await prisma.participant.create({
        data: {
          test_id: test.id,
          user_id: null,
          username: username,
          start_time: new Date(startTime),
        }
      });
    }
  }
  
  return NextResponse.json(
    { message: "Test Started", participant: newParticipant },
    { status: 201 }
  );
}