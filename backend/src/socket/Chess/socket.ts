import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { Chess } from "chess.js";
import { Rooms } from "../../models/Rooms";
import { Users } from "../../models/Users";

const gameInstances: Record<string, { game: Chess; players: { white: string; black: string } }> = {};

export const setupChessSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    socket.on("joinRoom", async ({ roomId, userId }) => {
      try {
        const user = await Users.findById(userId);
        const room = await Rooms.findById(roomId);

        if (!user || !room) {
          socket.emit("error", "User or room not found");
          return;
        }

        socket.join(roomId);

        // Add user to the room's user list if not already present
        if (!room.users.includes(user.username)) {
          room.users.push(user.username);
          await room.save();
        }

        // If there's only one player in the room, let them know they're waiting
        if (room.users.length < 2) {
          socket.emit("waitingForPlayer", {
            message: "⏳ waiting for player",
          });
          return;
        }

        // If the room hasn't started yet, handle game initialization
        if (!room.isStarted) {
          // Check user balance to ensure they can pay the room price
          if (user.usdtBalance < room.price) {
            socket.emit("error", "Not enough balance");
            return;
          }

          // Deduct room price and mark the room as started
          user.usdtBalance -= room.price;
          await user.save();

          room.isStarted = true;
          await room.save();

          // Determine white and black players
          const [white, black] = room.users;

          // Create a new game instance for this room
          gameInstances[roomId] = {
            game: new Chess(),
            players: { white, black },
          };
          const whiteUser = await Users.findOne({ _id: white}).lean();
          const blackUser = await Users.findOne({ _id: black}).lean();

          io.to(roomId).emit("playerInfo", {
            whitePlayer: { 
              username: whiteUser?.username || white,
              wins: whiteUser?.wins || 0,
              losses: whiteUser?.losses || 0,
            },
            blackPlayer: {
              username: blackUser?.username || black,
              wins: blackUser?.wins || 0,
              losses: blackUser?.losses || 0,
            },
          });

          // Emit the initial "gameState" event
          io.to(roomId).emit("gameState", {
            fen: gameInstances[roomId].game.fen(),
            turn: "w",
            white,
            black,
            message: `game started now turn for ${white}`,
          });
        }
      } catch (err) {
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
        socket.emit("notYourTurn", "is not your turn");
        return;
      }

      let move;
      try {
        move = game.move({ from, to, promotion: "q" });
      } catch (err) {
        socket.emit("invalidMove", { from, to });
        return;
      }

      if (!move) {
        socket.emit("invalidMove", { from, to });
        return;
      }

      // Broadcast the updated state to the room
      io.to(roomId).emit("gameState", {
        fen: game.fen(),
        lastMove: move,
        turn: game.turn(),
        white: players.white,
        black: players.black,
      });

      // Check for game over conditions
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
            message: `🏁 game over the winner is: ${winner}`,
          });

          // Clean up the game instance for this room
          delete gameInstances[roomId];
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });

  // Global error handlers
  process.on("unhandledRejection", (reason) => {
    console.error("🔥 Unhandled Rejection:", reason);
  });
  process.on("uncaughtException", (err) => {
    console.error("🔥 Uncaught Exception:", err);
  });
};
