// app/api/admin/init-db/route.js
// This endpoint should be protected and only called during deployment
import { setupDatabase } from "@/lib/mongodb-setup";

export async function POST(req) {
  // Add authentication check here for admin users only
  const { authorization } = req.headers;
  
  // Simple API key check (replace with your preferred auth method)
  if (authorization !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return new Response(
      JSON.stringify({ message: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const success = await setupDatabase();
    
    if (success) {
      return new Response(
        JSON.stringify({ 
          message: "Database initialized successfully",
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ message: "Failed to initialize database" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Database initialization error:", error);
    return new Response(
      JSON.stringify({ 
        message: "Database initialization failed",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// GET method to check database status
export async function GET(req) {
  const { authorization } = req.headers;
  
  if (authorization !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return new Response(
      JSON.stringify({ message: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const clientPromise = (await import("@/lib/mongodb")).default;
    const client = await clientPromise;
    const db = client.db("interviewprep");

    // Check collections and indexes
    const collections = await db.listCollections().toArray();
    const stats = {};

    for (const collection of collections) {
      const collectionName = collection.name;
      const indexes = await db.collection(collectionName).indexes();
      const count = await db.collection(collectionName).countDocuments();
      
      stats[collectionName] = {
        documentCount: count,
        indexCount: indexes.length,
        indexes: indexes.map(idx => idx.name)
      };
    }

    return new Response(
      JSON.stringify({ 
        message: "Database status retrieved successfully",
        collections: stats,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Database status check error:", error);
    return new Response(
      JSON.stringify({ 
        message: "Failed to check database status",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}