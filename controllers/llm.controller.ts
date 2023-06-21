import { Socket } from "https://deno.land/x/socket_io@0.2.0/mod.ts";

import { initializeModel } from "../models/llm.model.ts";

import {
  generateCheckForDataMessage,
  generateObjectivesMessage,
  handleToken,
} from "../services/llm.service.ts";
import {
  AIChatMessage,
  HumanChatMessage,
  SystemChatMessage,
} from "../util/deps.ts";
import {
  getChatHistory,
  removePetal,
  setPetal,
  storeMessage,
} from "./redis.controller.ts";
import { findPetalTemplate } from "../templates/findPetal.ts";
import { PetalStore } from "../models/petalStore.model.ts";
import { Petal, PetalFactory } from "../types/petal.ts";

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

  // Create the history input for the model
  const history = await getChatHistory(socket.id);
  const userMessage = new HumanChatMessage(message);
  history.push(userMessage);

  // Check message to see if program should be booted.
  const petal = await petalCheck(socket, message);

  if (petal) {
    // Check the message for petal objectives.
    const foundData = await checkForData(petal, message);

    if (foundData) {
      await setPetal(socket.id, petal);
    }

    console.log("--Checking for petal objectives--");
    // It's ok for objective to only be defined in
    // this scope because we will not add it to the
    // history in redis. This will save on the number
    // of tokens for future calls.
    const objectiveMessage = await generateObjectivesMessage(petal);

    if (objectiveMessage) {
      history.push(objectiveMessage);
    } else {
      await removePetal(socket.id);
    }
  }

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
): Promise<Petal | void> => {
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
  const prompt = findPetalTemplate();
  const petals = PetalStore.getPetals();
  const text = await prompt.format({
    list: petals.map((petal) => `- ${petal.getName()}`).join("\n"),
  });
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

      await setPetal(socket.id, petal);

      return petal;
    }
  } else {
    console.log("No petal picked!");
  }
};

/**
 * Collects any data the user may have provided in their message
 *
 * This function takes the petals objectives and checks the message for any data
 * the user may have provided. If the user has provided data, the function updates
 * the petal's objectives with the data and returns true. If the user has not provided
 * data, the function returns false.
 *
 * @param petal {Petal} The petal to check for data.
 * @param message {string} The message to check for data.
 *
 * @returns {boolean} True if the user provided data, false if not.
 */

export const checkForData = async (
  petal: Petal,
  message: string,
): Promise<boolean> => {
  console.log("--Checking for data--");
  const systemMessage = await generateCheckForDataMessage(petal);
  if (!systemMessage) {
    return false;
  }

  const userMessage = new HumanChatMessage(message);

  // Honestly, this could probably be
  // const history = await getChatHistory(socket.id);
  // But I'm trying to run this model for as cheap as possible.
  const history = [systemMessage, userMessage];

  // Initialize the model and get the response
  const model = initializeModel("OpenAI", "gpt-3.5-turbo", 0.1);
  const out = await model.call(history);
  console.log("checkForData out:");

  let data;
  try {
    data = JSON.parse(out.text);
  } catch (err) {
    console.log("Error parsing JSON from checkForData out");
  }

  if (data) {
    console.log("Data provided!");
    console.log(data);

    // Update the petal's objectives
    const keys = Object.keys(data);
    for (const key of keys) {
      try {
        if (data[key] === "N/A" || data[key].toLowerCase() === "unknown") {
          continue;
        }

        petal.updateObjective(key, data[key]);
      } catch (err) {
        console.log('Error updating petal objective: "' + key + '"' + err);

        petal.addAdditionalObejctive(key, data[key]);
      }
    }
  } else {
    console.log("No data provided!");
  }

  return true;
};
