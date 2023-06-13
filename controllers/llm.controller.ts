import { Socket } from "https://deno.land/x/socket_io@0.2.0/mod.ts";

import { initializeModel } from "../models/llm.model.ts";

import { handleToken } from "../services/llm.service.ts";
import {
  AIChatMessage,
  HumanChatMessage,
  SystemChatMessage,
} from "../util/deps.ts";
import { getChatHistory, setPetal, storeMessage } from "./redis.controller.ts";
import { findPetalTemplate } from "../templates/findPetal.ts";
import { PetalStore } from "../models/petalStore.model.ts";
import { PetalFactory } from "../types/petal.ts";

/**
 * Produces stream of AI generated tokens based on the chat history.
 *
 * Takes a human message and returns an AI response, will check for
 * a chat history in Redis and use that to generate the response
 * and finally store the new messages in Redis. This function also
 * checks if a petal should be picked and sends the petal to the
 * client.
 *
 * @param socket {Socket} The socket object that the message came from.
 * @param message {string} The message from the user to be added to the history.
 */
export const humanMessage = async (
  socket: Socket,
  message: string,
): Promise<void> => {
  console.log(`_________Handling human message for ${socket.id}_________`);

  // Variable to store the response
  let response = "";

  // Check message to see if program should be booted.
  const petal = await petalCheck(socket, message);

  // Create the history input for the model
  const history = await getChatHistory(socket.id);
  const userMessage = new HumanChatMessage(message);
  history.push(userMessage);

  // Initialize the model and get the response
  const model = initializeModel("OpenAI", "gpt-3.5-turbo");
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

/**
 * @param socket {Socket} The socket object to send the new petal to.
 * @param message {string} The message from the user to check if a petal should be picked.
 */
export const petalCheck = async (
  socket: Socket,
  message: string,
) => {
  // Check if there is already a petal attached to the room
  const petal = await PetalFactory.fromRedis(socket.id);
  if (petal) {
    // TODO?: Check if the petal should be changed based on the message.

    // This can probably be done by doing the PetalFactory.fromRedis call
    // and if statement after the message has been checked for petal.
    // Not even sure if petal should be changed based on message,
    // but in the future it might be relevant so I'm leaving a hint
    // for myself here.
    console.log("Petal already attached to room!", petal.getHash());
    return petal;
  }

  console.log("Checking if petal should be picked...");
  // Check message to see if program should be booted.
  const prompt = findPetalTemplate(PetalStore.getPetals());
  const text = await prompt.format({ message });
  const systemMessage = new SystemChatMessage(text);

  const userMessage = new HumanChatMessage(message);

  // Honestly, this could probably be
  // const history = await getChatHistory(socket.id);
  // But I'm trying to run this model for as cheap as possible.
  const history = [systemMessage, userMessage];

  // Initialize the model and get the response
  const model = initializeModel("OpenAI", "gpt-3.5-turbo", 0.1);
  const out = await model.call(history, undefined, [
    {
      // Handle the stream of tokens
      handleLLMNewToken(token: string) {
        socket.emit("petal", token);
      },
    },
  ]);

  // Check if the petal should be set
  if (out.text !== "none") {
    console.log("Picking petal:", out.text + "!");
    const petal = PetalStore.getPetalByName(out.text);
    if (petal) {
      socket.emit("setPetal", {
        name: petal.getName(),
        hash: petal.getHash(),
      });

      setPetal(socket.id, petal);
    }
  } else {
    console.log("No petal picked!");
  }

  return out;
};
