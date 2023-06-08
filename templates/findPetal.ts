import { PromptTemplate } from "../util/deps.ts";

import { Petal } from "../types/petal.ts";

export const findPetalTemplate = (petals: Petal[]): PromptTemplate => {
  const template =
    `Your goal is to see if any of the following programs would be useful to the users message. 
  The users message will be the next message and the programs will be a hyphen list, please only return the name of the program that you think would be useful:
  
  ${petals.map((petal) => `- ${petal.getName()}`).join("\n")}`;

  console.log(template);

  const prompt = new PromptTemplate({ template, inputVariables: ["message"] });

  return prompt;
};
