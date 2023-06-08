![Daisy](https://github.com/Bryt12/daisy/assets/8965979/d69aa179-f1d4-4045-8252-76ecda479924)

[![deno](https://img.shields.io/badge/deno-1.34.0-blue.svg?style=for-the-badge)](https://deno.land/)
[![langchain](https://img.shields.io/badge/🦜️🔗-0.0.86-blue.svg?style=for-the-badge)](https://github.com/hwchase17/langchainjs)
[![socketio](https://img.shields.io/badge/Socket.io-0.2.0-blue.svg?style=for-the-badge)](https://socket.io/blog/socket-io-deno/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.4-blue.svg?style=for-the-badge)](https://www.typescriptlang.org)

# Daisy

Daily Automation In Simple Yaml

## Description

This is a Deno server that hosts a chatbot interface for ChatGPT and uses redis
in the background to store the active conversations. It uses SocketsIO to rely
the message to the user as the LLM is producing it. The goal of this project is
to add a simlpe interface to add plugins to ChatGPT in a easy and natural way
through "petals" or yaml files that descibe the functionality of the plugin. The
petals have yet to be implemented or even architeched, waiting for my next fey mood.

## Installation

### Prerequisites

Docker Desktop: Make sure Docker is installed on your system. If not, you can download it from the [Docker website](https://www.docker.com/products/docker-desktop/).

### Setup

Create a .env in root of project

```
OPENAI_API_KEY=<Your OpenAI key>
REDIS_HOST="redis"
REDIS_PORT="6379"
```

Then in terminal run:

`docker-compose up`

Then you can use Socket IO to interact with the chat bot at http://localhost:3000, [the postman blog](https://blog.postman.com/postman-now-supports-socket-io/) has an article on how to use postman to interact with Socket IO server.

The SocketIO server has a listener on 'message' and emits on 'response'.
