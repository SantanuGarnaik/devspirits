const { MongoClient, ObjectId } = require("mongodb");
const fs = require("fs").promises;
const path = require("path");

// Load environment variables with explicit path and debug
const envPath = path.join(__dirname, ".env");
console.log("Attempting to load .env from:", envPath);
require("dotenv").config({ path: envPath });
console.log("DB_CONNECTION_STRING:", process.env.DB_CONNECTION_STRING);
console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("process.env:", process.env); // Log all environment variables

const uri = process.env.DB_CONNECTION_STRING;
const dbName = "interviewprep";

async function migrateData() {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    console.log("Connected to MongoDB successfully");
    const db = client.db(dbName);

    // Clear existing data in questions collection
    const questionsCollection = db.collection("questions");
    await questionsCollection.deleteMany({});
    console.log("Cleared existing questions collection");

    // Migrate questions data
    const dataDir = path.join(process.cwd(), "data");
    const jsonFiles = [
      "basic_javascript.json",
      "advanced_javascript.json",
      "react_js.json",
    ];

    const allQuestions = [];

    for (const fileName of jsonFiles) {
      const filePath = path.join(dataDir, fileName);
      const fileContents = await fs.readFile(filePath, "utf-8");
      const questions = JSON.parse(fileContents);
      allQuestions.push(...questions);
    }

    if (allQuestions.length > 0) {
      // Generate unique _id for each question
      const questionsWithIds = allQuestions.map((q, index) => ({
        ...q,
        _id: q._id || new ObjectId(), // Use MongoDB ObjectId or existing _id if present
      }));
      await questionsCollection.insertMany(questionsWithIds, {
        ordered: false,
      }); // ordered: false to continue on duplicates
      console.log(
        `Migrated ${questionsWithIds.length} questions to 'questions' collection`
      );
    }

    // Migrate users data
    const usersFilePath = path.join(dataDir, "users.json");
    const usersCollection = db.collection("users");
    try {
      const usersContent = await fs.readFile(usersFilePath, "utf-8");
      const users = JSON.parse(usersContent);
      if (users.length > 0) {
        await usersCollection.deleteMany({});
        await usersCollection.insertMany(users);
        console.log(`Migrated ${users.length} users to 'users' collection`);
      }
    } catch (error) {
      console.warn(
        "No users.json found or error parsing, skipping users migration"
      );
    }

    // Migrate user progress data
    const progressDir = path.join(dataDir, "user-progress");
    const progressFiles = await fs.readdir(progressDir);
    const progressCollection = db.collection("userProgress");

    for (const file of progressFiles) {
      if (file.endsWith(".json")) {
        const filePath = path.join(progressDir, file);
        const progressContent = await fs.readFile(filePath, "utf-8");
        const progress = JSON.parse(progressContent);
        const userId = path.basename(file, ".json");
        await progressCollection.updateOne(
          { userId },
          { $set: { userId, progress } },
          { upsert: true }
        );
        console.log(`Migrated progress for user ${userId}`);
      }
    }

    console.log("Data migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.close();
  }
}

migrateData().catch(console.dir);
