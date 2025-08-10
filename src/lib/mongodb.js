import { MongoClient } from "mongodb";

const uri = process.env.DB_CONNECTION_STRING;
const options = {};

let client;
let clientPromise;

if (!process.env.DB_CONNECTION_STRING) {
  throw new Error("Please add your MongoDB connection string to .env");
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
    console.log("MongoDB client initialized in development mode");
    global._mongoClientPromise
      .then(() => console.log("MongoDB client connected successfully"))
      .catch((err) => console.error("MongoDB connection error:", err));
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
  console.log("MongoDB client initialized in production mode");
  clientPromise
    .then(() => console.log("MongoDB client connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));
}

// Functions to get specific databases
export const getTestDatabase = () => clientPromise.then((client) => client.db("test"));
export const getInterviewprepDatabase = () => clientPromise.then((client) => client.db("interviewprep"));

export default clientPromise;