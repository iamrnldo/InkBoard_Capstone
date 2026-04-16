const redis = require("redis");
require("dotenv").config();

const { createRedisClient } = require("./config/redis");


let client = null;
let isConnected = false;

const createRedisClient = async () => {
    console.warn("⚠️  Redis unavailable, continuing without cache");
  if (client && isConnected) return client;

  client = redis.createClient({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retry_strategy: (options) => {
      if (options.error && options.error.code === "ECONNREFUSED") {
        console.warn("⚠️  Redis connection refused, running without cache");
        return undefined;
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        return undefined;
      }
      if (options.attempt > 10) {
        return undefined;
      }
      return Math.min(options.attempt * 100, 3000);
    },
  });

  client.on("connect", () => {
    isConnected = true;
    console.log("✅ Connected to Redis");
  });

  client.on("error", (err) => {
    isConnected = false;
    console.warn("⚠️  Redis error (non-fatal):", err.message);
  });

  client.on("end", () => {
    isConnected = false;
    console.warn("⚠️  Redis connection closed");
  });

  try {
    await client.connect();
  } catch (err) {
    console.warn("⚠️  Redis unavailable, cache disabled:", err.message);
    isConnected = false;
  }

  return client;
};

// Safe get with fallback
const cacheGet = async (key) => {
  try {
    if (!client || !isConnected) return null;
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.warn("Cache get error:", err.message);
    return null;
  }
};

// Safe set with TTL
const cacheSet = async (key, value, ttlSeconds = 300) => {
  try {
    if (!client || !isConnected) return false;
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn("Cache set error:", err.message);
    return false;
  }
};

// Safe delete
const cacheDel = async (key) => {
  try {
    if (!client || !isConnected) return false;
    await client.del(key);
    return true;
  } catch (err) {
    console.warn("Cache del error:", err.message);
    return false;
  }
};

// Delete by pattern
const cacheDelPattern = async (pattern) => {
  try {
    if (!client || !isConnected) return false;
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (err) {
    console.warn("Cache del pattern error:", err.message);
    return false;
  }
};

// Check if redis is available
const isRedisAvailable = () => isConnected;

module.exports = {
  createRedisClient,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  isRedisAvailable,
  getClient: () => client,
};
