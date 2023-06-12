import { PromptTemplate } from "../util/deps.ts";

import { Petal } from "../types/petal.ts";

export const findPetalTemplate = (petals: Petal[]): PromptTemplate => {
  const template =
    `Your goal is to see if any of the following programs would be useful to the users message. 
    Your output must only be the name of the program you think would be useful to the user. The exact
    string of your output will be directly fed into a map <name>: <program> so it's very crucial that
    you return ONLY the exact name or the EXACT string 'none'.

    The users message will be the next message and the programs are the following hyphen list:
  
  ${petals.map((petal) => `- ${petal.getName()}`).join("\n")}`;

  const prompt = new PromptTemplate({ template, inputVariables: ["message"] });

  return prompt;
};
