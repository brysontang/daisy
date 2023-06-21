import { PromptTemplate } from "../util/deps.ts";

/**
 * This template is used to prompt an LLM to find a petal in the user's message.
 *
 * In this template we remind the LLM that their goal is to find a petal in the user's
 * message. We also remind them that they must return the exact name of the petal or
 * the string 'none' if they don't think there is a petal in the user's message.
 * This is effective because it lets the LLM know that their output will be directly
 * fed into code so it's more likely to not return an explanation.
 *
 * @returns {PromptTemplate} The template for the find petal prompt.
 */
export const findObjectivesTemplate = (): PromptTemplate => {
  const template =
    `Match user's message with a given list, returning a JSON with the key as the info name and 
    value as the info or 'N/A' if absent. Output should only be JSON or 'N/A'. Assume nothing 
    unless specified; return 'N/A' if unsure. Don't infer value meanings.
    
    The users message will be the next message and the data points are the following hyphen list:
  
    {list}`;

  const prompt = new PromptTemplate({ template, inputVariables: ["list"] });

  return prompt;
};
