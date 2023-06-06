import { Socket } from "https://deno.land/x/socket_io@0.2.0/mod.ts";

import { initializeModel } from "../models/llm.model.ts";

import { handleToken } from "../services/llm.service.ts";
import { AIChatMessage, HumanChatMessage } from "../util/deps.ts";
import { getChatHistory, getPetal, storeMessage } from "./redis.controller.ts";

/**
 * Produces stream of AI generated tokens based on the chat history.
 *
 * Takes a human message and returns an AI response, will check for
 * a chat history in Redis and use that to generate the response
 * and store the new messages in Redis.
 *
 * @param socket - The socket object that the message came from.
 * @param message - The message from the user to be added to the history.
 */
export const humanMessage = async (
  socket: Socket,
  message: string,
): Promise<void> => {
  // Variable to store the response
  let response = "";

  // Check message to see if program should be booted.

  // Create the history input for the model
  const history = await getChatHistory(socket.id);
  const userMessage = new HumanChatMessage(message);
  history.push(userMessage);

  // Initialize the model and get the response
  const model = initializeModel("gpt-3.5-turbo");
  const out = await model.call(history, undefined, [
    {
      // Handle the stream of tokens
      handleLLMNewToken(token: string) {
        response = handleToken(response, token);
        socket.emit("response", response);
      },
    },
  ]);

  // Create the AI response message
  const aiReponse = new AIChatMessage(out.text);

  // Store the message in Redis
  storeMessage(socket.id, userMessage.toJSON());
  storeMessage(socket.id, aiReponse.toJSON());
};
