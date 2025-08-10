// import { getServerSession } from "next-auth/next";
// import clientPromise from "@/lib/mongodb";
// import { authOptions } from "@/lib/auth";

// export async function GET() {
//   console.log("Dashboard data request received");

//   // Get NextAuth session
//   const session = await getServerSession(authOptions);

//   if (!session) {
//     console.log("No active session, returning 401");
//     return new Response(JSON.stringify({ error: "Unauthorized" }), {
//       status: 401,
//       headers: { "Content-Type": "application/json" },
//     });
//   }

//   try {
//     const client = await clientPromise;
//     const db = client.db("interviewprep");

//     // Fetch questions
//     const questions = await db.collection("questions").find({}).toArray();

//     // Fetch user progress
//     const userId = session.user?.id;
//     const userProgress = (await db
//       .collection("userProgress")
//       .findOne({ userId })) || { progress: {} };

//     return new Response(
//       JSON.stringify({
//         initialQuestions: questions.map((q) => ({
//           ...q,
//           _id: q._id.toString(),
//         })),
//         initialProgress: userProgress.progress || {},
//       }),
//       {
//         status: 200,
//         headers: { "Content-Type": "application/json" },
//       }
//     );
//   } catch (error) {
//     console.error("Error fetching dashboard data:", error);
//     return new Response(JSON.stringify({ error: "Internal Server Error" }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// }

import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  console.log("Dashboard data request received");

  // Get NextAuth session
  const session = await getServerSession(authOptions);

  if (!session) {
    console.log("No active session, returning 401");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db("interviewprep");

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const section = searchParams.get("section") || "";
    const difficulty = searchParams.get("difficulty") || "";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Build MongoDB query
    const query = {};
    if (category) query.category = category;
    if (section) query.section = section;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.question = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    // Fetch questions with pagination
    const questions = await db
      .collection("questions")
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Fetch total count for pagination
    const totalQuestions = await db.collection("questions").countDocuments(query);

    // Fetch user progress
    const userId = session.user?.id;
    const userProgress = (await db
      .collection("userProgress")
      .findOne({ userId })) || { progress: {} };

    // Calculate user stats for filtered questions
    const completedQuestions = questions.filter(
      (q) => userProgress.progress[q._id]?.isCompleted
    ).length;
    const completionPercentage = totalQuestions
      ? Math.round((completedQuestions / totalQuestions) * 100)
      : 0;

    // Fetch all categories for filter dropdown
    const categories = await db
      .collection("questions")
      .distinct("category");

    return new Response(
      JSON.stringify({
        initialQuestions: questions.map((q) => ({
          ...q,
          _id: q._id.toString(),
        })),
        initialProgress: userProgress.progress || {},
        userStats: {
          totalQuestions,
          completedQuestions,
          completionPercentage,
          lastUpdated: new Date().toISOString(),
        },
        categories,
        totalPages: Math.ceil(totalQuestions / limit),
        currentPage: page,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}