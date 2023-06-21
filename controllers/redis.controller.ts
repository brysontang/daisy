import { typeFromObject } from "../models/llm.model.ts";
import { redis } from "../models/redis.model.ts";
import { Petal } from "../types/petal.ts";
import { BaseChatMessage, StoredMessage } from "../util/deps.ts";

/**
 * Takes a StoredMessage object, turns it into a string, and stores it in Redis.
 *
 * @param roomId {string} The ID of the room to store the message in, this is the redis key.
 * @param message {string} The message to store in Redis.
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
 * @param roomId {string} The ID of the room to get the chat history from.
 * @returns {Promise<BaseChatMessage[]>} The chat history in LangChain message format.
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
 * @param roomId {string} The ID of the room to get the petal from.
 * @returns {Promise<string | void>} The petal object as a string.
 */
export const getPetalData = async (roomId: string): Promise<string | void> => {
  const petal = await redis.get(roomId + ":petal");
  if (petal === null) {
    return;
  }
  return petal;
};

/**
 * Sets the petal for a room.
 *
 * Only storing a subset of the data in the petal object.
 * The only data that is needed to be stored in redis is
 * the hash to retrieve the full petal object later and the
 * tasks as they store the user collected data.
 *
 * @param roomId {string} The ID of the room to set the petal for.
 * @param petal {Petal} The petal object to set.
 *
 * @returns {Promise<void>}
 */
export const setPetal = async (
  roomId: string,
  petal: Petal,
): Promise<void> => {
  const petalData = {
    hash: petal.getHash(),
    tasks: petal.getTasks(),
  };

  await redis.set(roomId + ":petal", JSON.stringify(petalData));
};

/**
 * Remove petal from chat once it is completed.
 *
 * @param roomId {string} The ID of the room to remove the petal from.
 */
export const removePetal = async (roomId: string): Promise<void> => {
  await redis.del(roomId + ":petal");
};
