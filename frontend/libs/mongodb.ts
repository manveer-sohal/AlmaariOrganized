import mongoose from "mongoose";
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

//the '!' is added since it will NEVER be null since it comes from the .env
const MONGODB_URI = process.env.MONGODB_URI!;

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

//store the connection globaly, allow reuse across serverlesse enviorments
//global is a node.js, allowing variables to persist across function calls within same process
let cached = global.mongooseCache;

//check if cach exsits, otherwise create an object
if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

async function connectMongoDB() {
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
