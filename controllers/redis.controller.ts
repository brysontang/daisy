import { typeFromObject } from "../models/llm.model.ts";
import { redis } from "../models/redis.model.ts";
import { Petal } from "../types/petal.ts";
import { BaseChatMessage, StoredMessage } from "../util/deps.ts";

/**
 * Takes a StoredMessage object, turns it into a string, and stores it in Redis.
 *
 * @param roomId - The ID of the room to store the message in, this is the redis key.
 * @param message - The message to store in Redis.
 */
export const storeMessage = async (
  roomId: string,
  message: StoredMessage,
): Promise<void> => {
  await redis.rpush(roomId + ":chat_history", JSON.stringify(message));
};

/**
 * Retrieves the chat history from Redis and converts to LangChain message format.
 *
 * Retrieves the chat history from Redis, then loops through each message
 * and turns it into a BaseChatMessage type, this is so it can be used by
 * the LLM model.
 *
 * @param roomId - The ID of the room to get the chat history from.
 * @returns The chat history in LangChain message format.
 */
export const getChatHistory = async (
  roomId: string,
): Promise<BaseChatMessage[]> => {
  // Get the chat history from Redis
  const history = await redis.lrange(roomId + ":chat_history", 0, -1);

  // Loop through each message and turn it into a BaseChatMessage type
  const out = [];
  for (const sm of history) {
    const message = typeFromObject(JSON.parse(sm));
    out.push(message);
  }

  return out;
};

/**
 * Returns what petal is currently attached to the room.
 *
 * The petal can be thought of as a program or a mindset
 * that the AI is in. It is a way to change the AI's
 * function for the user.
 *
 * @param roomId: The ID of the room to get the petal from.
 * @returns The petal object.
 */
export const getPetal = async (roomId: string): Promise<Petal> => {
  const petal = await redis.get(roomId + ":petal");
  if (petal === null) {
    throw new Error("Petal not found");
  }
  return JSON.parse(petal);
};
