import { PromptTemplate } from "../util/deps.ts";

/**
 * This template lets the LLM know in the next message it should try to collect data.
 *
 * The template reminds the LLM that it's goal is to collect data from the user AND
 * that it should respond to the user's message. The input variable to the prompt are
 * the bot's name, the goal of the current task, and the objectives that still need to
 * be collected.
 *
 * @returns {PromptTemplate} The template for the collect data prompt.
 */
export const collectDataTemplate = (): PromptTemplate => {
  const template =
    `You are {botName} and your current goal is {goal}. The previous message is a message from the user.
Your message has two goals, first respond to the user's message and second collect the following information from the user:
  
{objectives}`;

  const prompt = new PromptTemplate({
    template,
    inputVariables: ["botName", "goal", "objectives"],
  });

  return prompt;
};
