// app/api/reset-progress/route.js
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = session.user.email;
    const client = await clientPromise;
    const db = client.db("interviewprep");

    // Reset user progress
    const result = await db.collection("userProgress").updateOne(
      { userId },
      {
        $set: {
          progress: {},
          totalQuestions: 0,
          completedQuestions: 0,
          completionPercentage: 0,
          updatedAt: new Date(),
          lastActivityDate: new Date().toISOString().split("T")[0],
        },
      },
      { upsert: true }
    );

    console.log("Progress reset for user:", userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Progress reset successfully" 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error resetting progress:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Failed to reset progress" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}