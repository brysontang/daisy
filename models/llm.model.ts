import {
  AIChatMessage,
  BaseChatMessage,
  ChatOpenAI,
  HumanChatMessage,
  StoredMessage,
  SystemChatMessage,
} from "../util/deps.ts";

import { env } from "../util/env.ts";

/**
 * Create a ChatOpenAI model.
 *
 * @param modelName - Name of the OpenAI chat model to use.
 * @returns A ChatOpenAI model instance.
 */
export const initializeModel = (modelName: string) => {
  const temperature = 0.5,
    maxTokens = 500;

  return new ChatOpenAI({
    openAIApiKey: env["OPENAI_API_KEY"],
    modelName,
    temperature,
    maxTokens,
    streaming: true,
  });
};

/**
 * Take a StoredMessage type and returns a BaseChatMessage type.
 *
 * LangChain uses an abstract class for the chat history, BaseChatMessage
 * There are three class that extend of BaseChatMessage:
 * HumanChatMessage
 * AIChatMessage
 * SystemChatMessage
 *
 * To turn these types into an object that can be stored in Redis we use
 * the toJSON() method, this turns the object into a StoredMessage type.
 *
 * This function takes a StoredMessage type and returns a BaseChatMessage type.
 *
 * @param sm - Raw stored message object.
 * @returns A BaseChatMessage type.
 */
export const typeFromObject = (sm: StoredMessage): BaseChatMessage => {
  const type = sm.type;
  const content = sm.data.content;

  if (type === "human") {
    return new HumanChatMessage(content);
  } else if (type === "ai") {
    return new AIChatMessage(content);
  } else if (type === "system") {
    return new SystemChatMessage(content);
  }

  return new SystemChatMessage(content);
};
