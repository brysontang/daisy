import { redisConnect } from "../util/deps.ts";
import { env } from "../util/env.ts";

let connectionOptions;

console.log(
  "Connecting to redis... ",
  env["REDIS_HOST"] +
    ":" +
    env["REDIS_PORT"],
);

if (!env["REDIS_PASSWORD"]) {
  connectionOptions = {
    hostname: env["REDIS_HOST"],
    port: env["REDIS_PORT"],
  };
} else {
  connectionOptions = {
    hostname: env["REDIS_HOST"],
    port: env["REDIS_PORT"],
    password: env["REDIS_PASSWORD"],
  };
}

// Create a Redis connection based on .env
export const redis = await redisConnect(connectionOptions);

console.log(`Connected to Redis at ${env["REDIS_HOST"]}!`);
