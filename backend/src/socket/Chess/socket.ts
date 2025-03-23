import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { Chess } from "chess.js";
import { Rooms } from "../../models/Rooms";
import { Users } from "../../models/Users";

const gameInstances: Record<string, { game: Chess, players: { white: string, black: string } }> = {};

export const setupSockets = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    socket.on("joinRoom", async ({ roomId, userId }) => {
      console.log(`➡️ joinRoom request - roomId: ${roomId}, userId: ${userId}`);

      try {
        const user = await Users.findById(userId);
        const room = await Rooms.findById(roomId);

        if (!user || !room) {
          console.log("❌ User or room not found");
          socket.emit("error", "User or room not found");
          return;
        }

        socket.join(roomId);
        console.log(`✅ ${user.username} joined room ${roomId}`);

        if (!room.users.includes(user.username)) {
          room.users.push(user.username);
          await room.save();
        }

        if (room.users.length < 2) {
          socket.emit("waitingForPlayer", {
            message: "⏳ ממתין לשחקן השני...",
          });
          return;
        }

        if (!room.isStarted) {
          room.isStarted = true;
          await room.save();

          const [white, black] = room.users;

          gameInstances[roomId] = {
            game: new Chess(),
            players: { white, black }
          };

          console.log(`♟️ Game started in room ${roomId} between ${white} (white) and ${black} (black)`);

          io.to(roomId).emit("gameState", {
            fen: gameInstances[roomId].game.fen(),
            turn: "w",
            white,
            black,
            message: `המשחק התחיל! תור של ${white}`,
          });
        }
      } catch (err) {
        console.error("❌ Error in joinRoom:", err);
        socket.emit("error", "Error joining room");
      }
    });

    socket.on("makeMove", async ({ roomId, from, to, username }) => {
      const instance = gameInstances[roomId];
      if (!instance) {
        socket.emit("error", "Game not found");
        return;
      }

      const { game, players } = instance;
      const currentTurn = game.turn() === "w" ? players.white : players.black;

      if (username !== currentTurn) {
        socket.emit("notYourTurn", "זה לא התור שלך!");
        return;
      }

      let move;
      try {
        move = game.move({ from, to, promotion: "q" });
      } catch (err) {
        console.error("❌ Invalid move:", err);
        socket.emit("invalidMove", { from, to });
        return;
      }

      if (!move) {
        socket.emit("invalidMove", { from, to });
        return;
      }

      io.to(roomId).emit("gameState", {
        fen: game.fen(),
        lastMove: move,
        turn: game.turn(),
        white: players.white,
        black: players.black,
      });

      if (game.isGameOver()) {
        const room = await Rooms.findById(roomId);
        if (room) {
          room.isFinished = true;
          const winner = game.turn() === "w" ? players.black : players.white;
          room.winner = winner;
          await room.save();

          io.to(roomId).emit("gameOver", {
            fen: game.fen(),
            winner,
            message: `🏁 המשחק הסתיים! המנצח: ${winner}`,
          });

          delete gameInstances[roomId];
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });

  // טיפול בשגיאות כלליות
  process.on("unhandledRejection", (reason) => {
    console.error("🔥 Unhandled Rejection:", reason);
  });
  process.on("uncaughtException", (err) => {
    console.error("🔥 Uncaught Exception:", err);
  });
};
