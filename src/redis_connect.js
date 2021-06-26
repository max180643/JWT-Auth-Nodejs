import redis from "redis";
import dotenv from "dotenv";

dotenv.config();
const { REDIS_HOST, REDIS_PORT } = process.env;

// connect to redis
const redis_client = redis.createClient(REDIS_PORT, REDIS_HOST);

redis_client.on("connect", () => {
  console.log("Redis client connected.");
});

export default redis_client;
