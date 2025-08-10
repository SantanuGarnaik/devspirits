// "use server";

// import { redirect } from "next/navigation";
// import { cookies } from "next/headers";
// import jwt from "jsonwebtoken";
// import clientPromise from "@/lib/mongodb";
// import InterviewLearningDashboardClient from "./dashboard/page";

// async function getInitialData(userId) {
//   const client = await clientPromise;
//   const db = client.db("interviewprep");

//   const questions = await db.collection("questions").find({}).toArray();
//   const userProgress = (await db
//     .collection("userProgress")
//     .findOne({ userId })) || { progress: {} };
// console.log("Fetched questions count:", questions.length);
//   return {
//     questions: questions.map((q) => ({ ...q, _id: q._id.toString() })),
//     initialProgress: userProgress.progress || {},
//   };
// }

// export default async function Page() {
//   const cookieStore = await cookies(); // Await cookies()
//   const token = cookieStore.get("token")?.value;

//   if (!token) {
//     redirect("/login");
//   }

//   let userId;

//   try {
//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET || "fallback-secret"
//     );
//     userId = decoded.id;
//   } catch (error) {
//     redirect("/login");
//   }

//   const { questions, initialProgress } = await getInitialData(userId);
//   console.log("Initial data fetched:", { questions, initialProgress });

//   return (
//     <InterviewLearningDashboardClient
//       initialQuestions={questions || []}
//       initialProgress={initialProgress || {}}
//     />
//   );
// }

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import InterviewLearningDashboardClient from "./dashboard/page";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

console.log("Page component executing");

async function getInitialData(userId) {
  const client = await clientPromise;
  const db = client.db("test");

  const questions = await db.collection("questions").find({}).toArray();
  const userProgress = (await db
    .collection("userProgress")
    .findOne({ userId })) || { progress: {} };

  return {
    questions: questions.map((q) => ({ ...q, _id: q._id.toString() })),
    initialProgress: userProgress.progress || {},
  };
}

export default async function Page() {
  console.log("Page component rendering");
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    console.log("No session or user ID, redirecting to login");
    redirect("/login");
  }

  const { questions, initialProgress } = await getInitialData(session.user.id);
console.log("Initial data fetched:", { questions, initialProgress }, session);

  return (
    <InterviewLearningDashboardClient
      initialQuestions={questions || []}
      initialProgress={initialProgress || {}}
      session={session}
    />
  );
}