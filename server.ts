import { httpServe, SocketIoServer } from "./util/deps.ts";
import { humanMessage, petalCheck } from "./controllers/llm.controller.ts";
import { PetalStore } from "./models/petalStore.model.ts";

// Create a new Socket.IO server
const io = new SocketIoServer();

io.on("connection", (socket) => {
  console.log(`socket ${socket.id} connected`);
  socket.on("message", async (message) => {
    // Check to see if the system should enter a petal mode
    let out = await petalCheck(socket, message);
    console.log(out);
    // We pass the socket here because we need to emit the response
    // back to the client as it's streamed.
    humanMessage(socket, message);
  });

  socket.on("disconnect", (reason) => {
    console.log(`socket ${socket.id} disconnected due to ${reason}`);
  });
});

// Create a new PetalStore
await PetalStore.loadPetals("./petals");

await httpServe(io.handler(), {
  port: 3000,
});
