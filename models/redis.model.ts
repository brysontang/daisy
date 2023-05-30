import { connect } from "https://deno.land/x/redis/mod.ts";
import { env } from "../util/env.ts";

// Create a Redis connection based on .env
export const redis = await connect({
  hostname: env["REDIS_HOST"],
  port: env["REDIS_PORT"],
  password: env["REDIS_PASSWORD"],
});

console.log(`Connected to Redis at ${env["REDIS_HOST"]}`);
