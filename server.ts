import { httpServe, SocketIoServer } from "./util/deps.ts";

import { humanMessage } from "./controllers/llm.controller.ts";
import { PetalStore } from "./models/petalStore.model.ts";

// Create a new PetalStore
await PetalStore.loadPetals("./petals");

// Create a new Socket.IO server
const socketServer = new SocketIoServer();

socketServer.on("connection", (socket) => {
  console.log(`socket ${socket.id} connected`);

  socket.on("message", (message) => {
    humanMessage(socket, message);
  });

  socket.on("disconnect", (reason) => {
    console.log(`socket ${socket.id} disconnected due to ${reason}`);
  });
});

await httpServe(socketServer.handler(), {
  port: 3000,
});
