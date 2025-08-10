// import { getServerSession } from "next-auth/next";
// import clientPromise from "@/lib/mongodb";
// import { authOptions } from "@/lib/auth";

// export async function POST(req) {
//   console.log("Save-progress request received");

//   // Get session from NextAuth
//   const session = await getServerSession(authOptions);

//   if (!session) {
//     console.log("No active session, returning 401");
//     return new Response(JSON.stringify({ message: "Unauthorized" }), {
//       status: 401,
//       headers: { "Content-Type": "application/json" },
//     });
//   }

//   try {
//     const { progress } = await req.json();
//     const userId = session.user?.id;
// console.log("Saving progress for user:", userId, "with data:", progress);

//     if (!userId) {
//       return new Response(JSON.stringify({ message: "Invalid session data" }), {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     const client = await clientPromise;
//     const db = client.db("interviewprep");

//     // Save or update progress in DB
//     const result = await db.collection("userProgress").updateOne(
//       { userId },
//       { $set: { progress, updatedAt: new Date() } },
//       { upsert: true }
//     );

//     console.log("MongoDB update result:", result);

//     return new Response(JSON.stringify({ message: "Progress saved" }), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     console.error("Error in save-progress:", error);
//     return new Response(JSON.stringify({ message: "Server error" }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// }


// app/api/save-progress/route.js
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  console.log("Save-progress request received at", new Date().toISOString());

  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      console.log("No active session or invalid user ID:", session?.user);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Unauthorized - Please login again",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { progress } = await req.json();
    const userId = session.user.email;

    console.log("Saving progress for user:", userId, "Progress:", progress);

    if (!progress || typeof progress !== "object" || Object.keys(progress).length === 0) {
      console.log("Invalid or empty progress data:", progress);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid or empty progress data format",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const client = await clientPromise;
    const db = client.db("interviewprep");

    const totalQuestions = Object.keys(progress).length;
    const completedQuestions = Object.values(progress).filter((p) => p?.isCompleted).length;
    const completionPercentage = totalQuestions > 0
      ? Math.round((completedQuestions / totalQuestions) * 100)
      : 0;

    const progressData = {
      userId,
      progress,
      updatedAt: new Date(),
      totalQuestions,
      completedQuestions,
      completionPercentage,
      lastActivityDate: new Date().toISOString().split("T")[0],
    };

    const result = await db.collection("userProgress").updateOne(
      { userId },
      { $set: progressData, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    console.log("MongoDB update result:", {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId,
    });

    if (result.matchedCount === 0 && result.upsertedId) {
      console.log("New user progress document created for:", userId);
    } else if (result.modifiedCount === 0) {
      console.log("No changes detected in progress for:", userId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Progress saved successfully",
        stats: {
          totalQuestions,
          completedQuestions,
          completionPercentage,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in save-progress:", error.stack);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET(req) {
  console.log("Get-progress request received at", new Date().toISOString());

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log("Unauthorized GET request:", session?.user);
      return new Response(
        JSON.stringify({ message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = session.user.email;
    const client = await clientPromise;
    const db = client.db("interviewprep");

    const userProgress = await db.collection("userProgress").findOne({ userId });

    console.log("Retrieved user progress for:", userId, "Result:", userProgress);

    if (!userProgress) {
      console.log("No progress found for user:", userId);
      return new Response(
        JSON.stringify({
          success: true,
          progress: {},
          stats: {
            totalQuestions: 0,
            completedQuestions: 0,
            completionPercentage: 0,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        progress: userProgress.progress || {},
        stats: {
          totalQuestions: userProgress.totalQuestions || 0,
          completedQuestions: userProgress.completedQuestions || 0,
          completionPercentage: userProgress.completionPercentage || 0,
          lastUpdated: userProgress.updatedAt?.toISOString(),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching progress:", error.stack);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to fetch progress" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}