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
export const findPetalTemplate = (): PromptTemplate => {
  const template =
    `Your goal is to see if any of the following programs would be useful to the users message. 
    Your output must only be the name of the program you think would be useful to the user. The exact
    string of your output will be directly fed into a map <name>: <program> so it's very crucial that
    you return ONLY the exact name or the EXACT string 'none'.

    The users message will be the next message and the programs are the following hyphen list:
  
  {list}`;

  const prompt = new PromptTemplate({ template, inputVariables: ["list"] });

  return prompt;
};
