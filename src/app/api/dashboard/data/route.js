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

// src/app/api/dashboard/data/route.js
// import { getServerSession } from "next-auth/next";
// import clientPromise from "@/lib/mongodb";
// import { authOptions } from "@/lib/auth";

// export async function GET(request) {
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

//     // Extract query parameters
//     const { searchParams } = new URL(request.url);
//     const category = searchParams.get("category") || "";
//     const section = searchParams.get("section") || "";
//     const difficulty = searchParams.get("difficulty") || "";
//     const search = searchParams.get("search") || "";
//     const page = parseInt(searchParams.get("page") || "1", 10);
//     const limit = parseInt(searchParams.get("limit") || "10", 10);

//     // Build MongoDB query
//     const query = {};
//     if (category) query.category = category;
//     if (section) query.section = section;
//     if (difficulty) query.difficulty = difficulty;
//     if (search) {
//       query.question = { $regex: search, $options: "i" }; // Case-insensitive search
//     }

//     // Fetch questions with pagination
//     const questions = await db
//       .collection("questions")
//       .find(query)
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .toArray();

//     // Fetch total count for pagination
//     const totalQuestions = await db.collection("questions").countDocuments(query);

//     // Fetch user progress
//     const userId = session.user?.id;
//     const userProgress = (await db.collection("userProgress").findOne({ userId })) || { progress: {} };

//     // Calculate user stats for filtered questions
//     const completedQuestions = questions.filter(
//       (q) => userProgress.progress[q._id]?.isCompleted
//     ).length;
//     const completionPercentage = totalQuestions
//       ? Math.round((completedQuestions / totalQuestions) * 100)
//       : 0;

//     // Fetch all categories for filter dropdown
//     const categories = await db
//       .collection("questions")
//       .distinct("category");

//     return new Response(
//       JSON.stringify({
//         initialQuestions: questions.map((q) => ({
//           ...q,
//           _id: q._id.toString(),
//         })),
//         initialProgress: userProgress.progress || {},
//         userStats: {
//           totalQuestions,
//           completedQuestions,
//           completionPercentage,
//           lastUpdated: new Date().toISOString(),
//         },
//         categories,
//         totalPages: Math.ceil(totalQuestions / limit),
//         currentPage: page,
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

// import { getServerSession } from "next-auth/next";
// import clientPromise from "@/lib/mongodb";
// import { authOptions } from "@/lib/auth";
// import { ObjectId } from "mongodb";

// export async function GET(request) {
//   console.log("Dashboard data request received");

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
//     const userId = session.user?.id;
//     const userProgress = (await db
//       .collection("userProgress")
//       .findOne({ userId })) || { progress: {} };
//     const completedIds = Object.entries(userProgress.progress || {})
//       .filter(([_, p]) => p.isCompleted)
//       .map(([id]) => new ObjectId(id));

//     const { searchParams } = new URL(request.url);

//     if (!searchParams.has("page")) {
//       const totalQuestions = await db
//         .collection("questions")
//         .countDocuments({});
//       const completedQuestions =
//         completedIds.length > 0
//           ? await db
//               .collection("questions")
//               .countDocuments({ _id: { $in: completedIds } })
//           : 0;
//       const completionPercentage =
//         totalQuestions > 0
//           ? Math.round((completedQuestions / totalQuestions) * 100)
//           : 0;

//       const categoryTotals = await db
//         .collection("questions")
//         .aggregate([{ $group: { _id: "$category", total: { $sum: 1 } } }])
//         .toArray();

//       const categoryCompleted =
//         completedIds.length > 0
//           ? await db
//               .collection("questions")
//               .aggregate([
//                 { $match: { _id: { $in: completedIds } } },
//                 { $group: { _id: "$category", completed: { $sum: 1 } } },
//               ])
//               .toArray()
//           : [];

//       const categoryStats = categoryTotals.map((tot) => {
//         const comp = categoryCompleted.find((c) => c._id === tot._id) || {
//           completed: 0,
//         };
//         const percentage =
//           tot.total > 0 ? Math.round((comp.completed / tot.total) * 100) : 0;
//         return {
//           category: tot._id,
//           total: tot.total,
//           completed: comp.completed,
//           percentage,
//         };
//       });

//       const categories = categoryTotals.map((t) => t._id);

//       return new Response(
//         JSON.stringify({
//           initialQuestions: [],
//           categories,
//           categoryStats,
//           userStats: {
//             totalQuestions,
//             completedQuestions,
//             completionPercentage,
//             lastUpdated: new Date().toISOString(),
//           },
//         }),
//         {
//           status: 200,
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     } else {
//       const category = searchParams.get("category") || "";
//       const section = searchParams.get("section") || "";
//       const difficulty = searchParams.get("difficulty") || "";
//       const search = searchParams.get("search") || "";
//       const page = parseInt(searchParams.get("page") || "1", 10);
//       const limit = parseInt(searchParams.get("limit") || "10", 10);

//       const query = { category }; // Enforce category from URL
//       if (section) query.section = section;
//       if (difficulty) query.difficulty = difficulty;
//       if (search) {
//         query.question = { $regex: search, $options: "i" };
//       }

//       const questions = await db
//         .collection("questions")
//         .find(query)
//         .skip((page - 1) * limit)
//         .limit(limit)
//         .toArray();

//       const totalQuestions = await db
//         .collection("questions")
//         .countDocuments(query);

//       const completedQuestions =
//         completedIds.length > 0
//           ? await db
//               .collection("questions")
//               .countDocuments({ ...query, _id: { $in: completedIds } })
//           : 0;
//       const completionPercentage =
//         totalQuestions > 0
//           ? Math.round((completedQuestions / totalQuestions) * 100)
//           : 0;

//       const categories = await db.collection("questions").distinct("category");

//       return new Response(
//         JSON.stringify({
//           initialQuestions: questions.map((q) => ({
//             ...q,
//             _id: q._id.toString(),
//           })),
//           initialProgress: userProgress.progress || {},
//           userStats: {
//             totalQuestions,
//             completedQuestions,
//             completionPercentage,
//             lastUpdated: new Date().toISOString(),
//           },
//           categories,
//           totalPages: Math.ceil(totalQuestions / limit),
//           currentPage: page,
//         }),
//         {
//           status: 200,
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     }
//   } catch (error) {
//     console.error("Error fetching dashboard data:", error);
//     return new Response(JSON.stringify({ error: "Internal Server Error" }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// }

// app/api/dashboard/data/route.js (updated)

import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(request) {
  console.log("Dashboard data request received at", new Date().toISOString());

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
    const userId = session.user?.email || session.user?.id; // Fallback to email if id is missing
    console.log("User ID from session:", userId);

    const userProgress = (await db.collection("userProgress").findOne({ userId })) || { progress: {} };
    console.log("User Progress:", userProgress);
    const completedIds = Object.entries(userProgress.progress || {})
      .filter(([_, p]) => p.isCompleted)
      .map(([id]) => new ObjectId(id));

    const { searchParams } = new URL(request.url);
    console.log("Search Params:", Object.fromEntries(searchParams));

    if (!searchParams.has("page")) {
      const totalQuestions = await db.collection("questions").countDocuments({});
      const completedQuestions = completedIds.length > 0
        ? await db.collection("questions").countDocuments({ _id: { $in: completedIds } })
        : 0;
      const completionPercentage = totalQuestions > 0
        ? Math.round((completedQuestions / totalQuestions) * 100)
        : 0;

      const categoryTotals = await db
        .collection("questions")
        .aggregate([{ $group: { _id: "$category", total: { $sum: 1 } } }])
        .toArray();
      const categoryCompleted = completedIds.length > 0
        ? await db
            .collection("questions")
            .aggregate([
              { $match: { _id: { $in: completedIds } } },
              { $group: { _id: "$category", completed: { $sum: 1 } } },
            ])
            .toArray()
        : [];

      const categoryStats = categoryTotals.map((tot) => {
        const comp = categoryCompleted.find((c) => c._id === tot._id) || { completed: 0 };
        const percentage = tot.total > 0 ? Math.round((comp.completed / tot.total) * 100) : 0;
        return {
          category: tot._id,
          total: tot.total,
          completed: comp.completed,
          percentage,
        };
      });

      const categories = categoryTotals.map((t) => t._id);

      console.log("No page param response:", { totalQuestions, completedQuestions, categoryStats });
      return new Response(
        JSON.stringify({
          initialQuestions: [],
          categories,
          categoryStats,
          userStats: {
            totalQuestions,
            completedQuestions,
            completionPercentage,
            lastUpdated: new Date().toISOString(),
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      const category = searchParams.get("category") || "";
      const section = searchParams.get("section") || "";
      const difficulty = searchParams.get("difficulty") || "";
      const search = searchParams.get("search") || "";
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "10", 10);

      console.log("Pagination params:", { category, section, difficulty, search, page, limit });

      const query = { category: { $regex: new RegExp(category, "i") } }; // Case-insensitive
      if (section) query.section = section;
      if (difficulty) query.difficulty = difficulty;
      if (search) query.question = { $regex: search, $options: "i" };

      console.log("MongoDB Query:", query);

      const questions = await db
        .collection("questions")
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      const totalQuestions = await db.collection("questions").countDocuments(query);
      const completedQuestions = completedIds.length > 0
        ? await db
            .collection("questions")
            .countDocuments({ ...query, _id: { $in: completedIds } })
        : 0;
      const completionPercentage = totalQuestions > 0
        ? Math.round((completedQuestions / totalQuestions) * 100)
        : 0;

      const categories = await db.collection("questions").distinct("category");

      // Fetch all sections for the category (without other filters)
      const sectionQuery = { category: { $regex: new RegExp(category, "i") } };
      const allSections = await db.collection("questions").distinct("section", sectionQuery);

      console.log("Fetched Questions:", questions);
      console.log("All Sections for Category:", allSections);

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
          allSections,
          totalPages: Math.ceil(totalQuestions / limit),
          currentPage: page,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error.stack);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}