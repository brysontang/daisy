import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { serve } from "https://deno.land/std@0.166.0/http/server.ts";

import { humanMessage } from "./controllers/llm.controller.ts";

// Create a new Socket.IO server
const io = new Server();

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

await serve(io.handler(), {
  port: 3000,
});
