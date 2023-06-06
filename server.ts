import { httpServe, SocketIoServer } from "./util/deps.ts";
import { humanMessage } from "./controllers/llm.controller.ts";
import { PetalStore } from "./models/petal.model.ts";

// Create a new Socket.IO server
const io = new SocketIoServer();

io.on("connection", (socket) => {
  console.log(`socket ${socket.id} connected`);
  socket.on("message", (message) => {
    // We pass the socket here because we need to emit the response
    // back to the client as it's streamed.
    humanMessage(socket, message);
  });

  socket.on("disconnect", (reason) => {
    console.log(`socket ${socket.id} disconnected due to ${reason}`);
  });
});

// Create a new PetalStore
PetalStore.loadPetals("./petals");

await httpServe(io.handler(), {
  port: 3000,
});
