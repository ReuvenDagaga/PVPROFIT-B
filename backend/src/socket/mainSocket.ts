import { Server } from "socket.io";
import { setupChessSocket } from "./Chess/socket";
import { setup2048Socket } from "./2048/socket";

export const setupAllSockets = (io: Server) => {
  setupChessSocket(io);
  setup2048Socket(io);
};
