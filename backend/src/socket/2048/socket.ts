import { Server } from "socket.io";
import { Rooms } from "../../models/Rooms";
import { Users } from "../../models/Users";

interface Player2048 {
  userId: string;
  grid: number[][]; // Stores the current board state
  score: number;
  isOver: boolean;
}

// שמירת מצב החדר – מיפוי של roomId -> userId -> Player2048
const roomStates: Record<string, Record<string, Player2048>> = {};

// שמירת טיימרים לכל חדר – מיפוי roomId -> NodeJS.Timeout
const roomTimers: Record<string, NodeJS.Timeout> = {};

// משך המשחק (2 דקות)
const GAME_DURATION_MS = 2 * 60 * 1000;

export const setup2048Socket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("🟢 [2048] Socket connected:", socket.id);

    socket.on("join2048Room", async ({ roomId, userId }) => {
      console.log(`Attempting to join room ${roomId} as user ${userId}`);
      try {
        const user = await Users.findById(userId);
        const room = await Rooms.findById(roomId);
        if (!user || !room) {
          console.error("Room or user not found");
          socket.emit("error", "Room or user not found");
          return;
        }

        socket.join(roomId);
        console.log(`✅ ${user.username} joined 2048 room ${roomId}`);

        // אתחול מצב החדר במידה ואינו קיים, והפעלת טיימר למשחק
        if (!roomStates[roomId]) {
          roomStates[roomId] = {};
          roomTimers[roomId] = setTimeout(async () => {
            console.log(`Game in room ${roomId} ended due to timeout`);
            // אם הטיימר נגמר, נסמן את כל השחקנים כסיימו את המשחק
            Object.values(roomStates[roomId]).forEach((player) => {
              if (!player.isOver) player.isOver = true;
            });
            await finishGame(roomId, io);
          }, GAME_DURATION_MS);
        }

        // הוספת השחקן למצב החדר
        roomStates[roomId][userId] = {
          userId,
          grid: [],
          score: 0,
          isOver: false,
        };

        socket.emit("joined2048", { message: "Joined 2048 room" });
      } catch (err) {
        console.error("❌ join2048Room error:", err);
        socket.emit("error", "Join room failed");
      }
    });

    socket.on("update2048", async ({ roomId, userId, grid, score, isOver }) => {
      console.log(`Received update from user ${userId} in room ${roomId}`);
      if (!roomStates[roomId] || !roomStates[roomId][userId]) {
        console.error(`Room state not found for user ${userId} in room ${roomId}`);
        return;
      }

      // עדכון המצב עבור השחקן
      roomStates[roomId][userId] = { userId, grid, score, isOver };
      console.log(`Updated state for user ${userId}:`, roomStates[roomId][userId]);

      // שידור העדכון לשחקן היריב
      socket.to(roomId).emit("opponent2048", { grid, score, isOver });
      console.log(`Emitted opponent update from user ${userId} to room ${roomId}`);

      // בדיקה אם שני השחקנים סיימו את המשחק
      const players = Object.values(roomStates[roomId]);
      if (players.length === 2 && players.every((p) => p.isOver)) {
        // ביטול הטיימר במקרה שהמשחק נגמר לפני הזמן
        if (roomTimers[roomId]) {
          clearTimeout(roomTimers[roomId]);
          delete roomTimers[roomId];
        }
        await finishGame(roomId, io);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 [2048] Socket disconnected:", socket.id);
      // אפשר להוסיף לוגיקה לניקוי roomStates בהתנתקות במידת הצורך
    });
  });
};

/**
 * פונקציה לסיום המשחק: חישוב מנצח, עדכון מסד נתונים ושידור תוצאות לשחקנים.
 */
async function finishGame(roomId: string, io: Server) {
  if (!roomStates[roomId]) return;
  const players = Object.values(roomStates[roomId]);
  let winner: string | null = null;

  if (players.length === 1) {
    winner = players[0].userId;
  } else if (players.length === 2) {
    const [p1, p2] = players;
    winner = p1.score === p2.score ? null : p1.score > p2.score ? p1.userId : p2.userId;
  }

  console.log(
    `Game over in room ${roomId}. Scores: ${players
      .map((p) => `${p.userId}: ${p.score}`)
      .join(", ")}. Winner: ${winner}`
  );

  io.to(roomId).emit("gameOver2048", {
    scores: players.reduce((acc, p) => ({ ...acc, [p.userId]: p.score }), {}),
    winner,
  });

  // עדכון מסמך החדר במסד הנתונים
  try {
    await Rooms.findByIdAndUpdate(roomId, { isFinished: true, winner });
    console.log(`Updated room ${roomId} with winner: ${winner}`);
  } catch (error) {
    console.error("Error updating room:", error);
  }

  // עדכון סטטיסטיקות המשתמשים – מנצח ומפסיד (במידה ויש)
  if (winner && players.length === 2) {
    const loser = players.find((p) => p.userId !== winner)?.userId;
    try {
      await Users.findByIdAndUpdate(winner, { $inc: { wins: 1 } });
      if (loser) {
        await Users.findByIdAndUpdate(loser, { $inc: { losses: 1 } });
      }
      console.log(
        `Updated users: Winner (${winner}) wins incremented; Loser (${loser}) losses incremented.`
      );
    } catch (error) {
      console.error("Error updating users:", error);
    }
  } else {
    console.log("The game ended in a tie or only one player participated. No updates to wins/losses.");
  }

  // ניקוי מצב החדר
  delete roomStates[roomId];
}
