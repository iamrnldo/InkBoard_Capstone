const redis = require("redis");
require("dotenv").config();

let client = null;
let isConnected = false;

const createRedisClient = async () => {
  if (client && isConnected) return client;

  client = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT) || 6379,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.warn("⚠️  Redis max retries reached, disabling cache");
          return false;
        }
        return Math.min(retries * 100, 3000);
      },
    },
    password: process.env.REDIS_PASSWORD || undefined,
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

  client.on("reconnecting", () => {
    console.warn("⚠️  Redis reconnecting...");
  });

  try {
    await client.connect();
  } catch (err) {
    console.warn("⚠️  Redis unavailable, cache disabled:", err.message);
    isConnected = false;
  }

  return client;
};

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
