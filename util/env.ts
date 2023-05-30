// Load environment variables from .env file. I didn't want to have two
// lines of code to load the .env file where I needed it so I made this
// util file.

import { dotenvLoad } from "../util/deps.ts";

export const env = await dotenvLoad();
