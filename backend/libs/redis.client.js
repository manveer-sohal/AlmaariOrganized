import dotenv from "dotenv";
import { createClient } from "redis";

dotenv.config();
const redisUrl = process.env.REDIS_URL;
const isTestEnv = process.env.NODE_ENV === "test";
let redis;
let _redisDnsErrorLogged = false; // dedupe DNS error logs

if (isTestEnv) {
  redis = {
    isOpen: false,
    on: () => {},
    connect: async () => {},
    ping: async () => {},
    get: async () => null,
    set: async () => {},
  };
} else {
  if (!redisUrl) {
    console.warn(
      "UPSTASH_REDIS_URL is missing. Caching will be disabled and the app will fall back to MongoDB."
    );
    redis = {
      isOpen: false,
      on: () => {},
      connect: async () => {},
      ping: async () => {},
      get: async () => null,
      set: async () => {},
    };
  } else {
    // Real Redis client
    const realClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          // backoff a bit, but stop trying after 3 attempts
          if (retries > 3) return new Error("Stop reconnecting to Redis");
          return Math.min(retries * 500, 2000);
        },
      },
    });

    realClient.on("error", (err) => {
      // Avoid spamming logs on DNS failures
      if (err && err.code === "ENOTFOUND") {
        if (!_redisDnsErrorLogged) {
          console.error("Redis client DNS error (once):", err);
          _redisDnsErrorLogged = true;
        }
        return; // swallow further repeats
      }
      console.error("Redis client error:", err);
    });

    try {
      if (!realClient.isOpen) {
        await realClient.connect();
        await realClient.ping();
        console.log("✅ Redis connected");
      }
    } catch (err) {
      console.error(
        "Failed to connect to Redis. Continuing without cache:",
        err
      );
      // Stop the real client and remove listeners to prevent further error spam
      try {
        await realClient.quit();
      } catch (_) {
        /* ignore */
      }
      try {
        realClient.removeAllListeners && realClient.removeAllListeners();
      } catch (_) {
        /* ignore */
      }
      // Swap in a no-op shim so subsequent calls don't throw
      redis = {
        isOpen: false,
        on: () => {},
        connect: async () => {},
        ping: async () => {},
        get: async () => null,
        set: async () => {},
      };
    }
    if (!redis) {
      // if connect succeeded, use the real clilent
      redis = realClient;
    }
  }
}

export { redis };
