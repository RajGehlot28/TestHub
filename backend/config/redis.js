const { performance } = require('perf_hooks');

// In-Memory Redis Fallback Store
const memoryCache = new Map();
const memoryHashes = new Map();
const memoryTTLs = new Map();

function cleanExpiredKeys() {
  const now = Date.now();
  for (const [key, expireTime] of memoryTTLs.entries()) {
    if (now > expireTime) {
      memoryCache.delete(key);
      memoryHashes.delete(key);
      memoryTTLs.delete(key);
    }
  }
}
setInterval(cleanExpiredKeys, 10000);

let redisClient = null;
let isRedisConnected = false;

try {
  const Redis = require('ioredis');
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  redisClient = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 1500,
    enableOfflineQueue: false
  });

  redisClient.connect().then(() => {
    isRedisConnected = true;
    console.log('⚡ Redis Connected: High-Speed In-Memory Cache Active!');
  }).catch(() => {
    isRedisConnected = false;
    console.log('ℹ️ Local Redis not active. Activated High-Performance Memory-Redis Store.');
  });
} catch (err) {
  isRedisConnected = false;
  console.log('ℹ️ Using High-Performance Memory-Redis Store.');
}

const redisStore = {
  async get(key) {
    if (isRedisConnected && redisClient) {
      try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch (e) {
        // Fallback
      }
    }
    cleanExpiredKeys();
    const val = memoryCache.get(key);
    return val !== undefined ? JSON.parse(val) : null;
  },

  async set(key, val, ttlSeconds = 3600) {
    const stringVal = JSON.stringify(val);
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.set(key, stringVal, 'EX', ttlSeconds);
        return true;
      } catch (e) {
        // Fallback
      }
    }
    memoryCache.set(key, stringVal);
    if (ttlSeconds) {
      memoryTTLs.set(key, Date.now() + (ttlSeconds * 1000));
    }
    return true;
  },

  async hset(key, field, val) {
    const stringVal = typeof val === 'string' ? val : JSON.stringify(val);
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.hset(key, field, stringVal);
        return true;
      } catch (e) {
        // Fallback
      }
    }
    if (!memoryHashes.has(key)) {
      memoryHashes.set(key, new Map());
    }
    memoryHashes.get(key).set(field, stringVal);
    return true;
  },

  async hgetall(key) {
    if (isRedisConnected && redisClient) {
      try {
        const raw = await redisClient.hgetall(key);
        const parsed = {};
        for (const [k, v] of Object.entries(raw)) {
          try { parsed[k] = JSON.parse(v); } catch { parsed[k] = v; }
        }
        return parsed;
      } catch (e) {
        // Fallback
      }
    }
    cleanExpiredKeys();
    const map = memoryHashes.get(key);
    if (!map) return {};
    const result = {};
    for (const [k, v] of map.entries()) {
      try { result[k] = JSON.parse(v); } catch { result[k] = v; }
    }
    return result;
  },

  async del(key) {
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.del(key);
      } catch (e) {
        // Fallback
      }
    }
    memoryCache.delete(key);
    memoryHashes.delete(key);
    memoryTTLs.delete(key);
    return true;
  },

  isRealRedis() {
    return isRedisConnected;
  }
};

module.exports = redisStore;
