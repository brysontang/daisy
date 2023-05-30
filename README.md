# daisy

Daily Automation In Simple Yaml

To use first install [deno](https://deno.com/manual@v1.34.1/getting_started/installation).

Create a .env in root of project

```
OPENAI_API_KEY=<Your OpenAI key>
REDIS_HOST=<Redis host url>
REDIS_PASSWORD=<Redis default password>
REDIS_PORT=<Redis port>
```

Then in terminal run:

`deno run --allow-net --allow-read --allow-env server.ts`

Then you can use Socket IO to interact with the chat bot [here](https://blog.postman.com/postman-now-supports-socket-io/) is a blog post
on how to use postman to interact with Socket IO server.
