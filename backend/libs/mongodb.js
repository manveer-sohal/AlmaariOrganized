import mongoose from "mongoose";
import dotenv from "dotenv";
if (process.env.NODE_ENV !== "test") {
  dotenv.config();
}
const isTestEnv = process.env.NODE_ENV === "test";
/*

In a serverless enviorment (like next,js API routes on Vercel AWS Lambda, or similar platforms)
caching avoids overhead.

Since it is a serverless Architecture (Meaning the server is managed by the cloud service provider),
Each API call or route can cause a new instance of the application. This is due to COLD STARTS 
which occur when the application code is invoked after a long time of inactivity, Therefor a new connection request
gets made 

The overhead comes from the network latency and handshakes from new connections. caching the connection
avoids it to redo connection to the database.

NEW CONNECTIONS:
- DNS resolution
- TCP handshake
- Authentication handshake

Yes, thier is connection pooling which allows multiple open connections to be maintaned which will 
improve performance for high-concuurency workloads within a single process, but in the serverless
enviorment this project is on, each incoming request might start a new isolated process (cold start).

so keeping the connection in a global variable allows it to persist as long as the serverless
funcvtion instance is warm

(GPT)
Why MongoDB Doesn't Handle This Automatically
MongoDB (or its drivers) does not cache connections across processes because:

- Connection pooling only works within a single process.
- Serverless environments create new isolated processes for cold starts, and MongoDB has no visibility into these processes.

*/

console.log("Connecting to MongoDB...");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Their is an issue with the MONGODB_URI");
}

let cached = global.mongooseCache;

//check if cach exsits, otherwise create an object
if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

async function connectMongoDB() {
  if (process.env.NODE_ENV === "test") {
    if (
      process.env.MONGODB_URI &&
      !process.env.MONGODB_URI.includes("mongodb-memory-server")
    ) {
      throw new Error(
        "❌ Tests attempted to connect to a non-test MongoDB URI",
      );
    }
  }
  // Prevent connecting during tests if already connected
  if (isTestEnv && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  // Prevent reconnecting if Mongoose is already connected
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose.connection;
    return cached.conn;
  }
  //if the conenction exists in the cache, return it
  //prevents unnecessary re-connections
  if (cached.conn) {
    return cached.conn;
  }
  //if a new connection is not being attempted
  //useNewUrlParser: true: Ensures the connection string is parsed correctly.
  //useUnifiedTopology: true: Enables the new connection management engine in Mongoose for better performance.
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI)
      .then((mongooseConnection) => {
        console.log("MongoDB connected successfully.");
        return mongooseConnection;
      })
      .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
        cached.promise = null; // Reset promise so future attempts can retry
        throw error; // Re-throw the error for the calling function to handle
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.log("Could not conenct to MongoDB", error);
    throw error;
  }
}

export default connectMongoDB;
