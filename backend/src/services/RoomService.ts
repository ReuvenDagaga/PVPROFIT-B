import mongoose from "mongoose";
import { Room } from "../interfaces/Room";
import { GameType } from "../enums/GameType";
import { UserStatus } from "../enums/UserStatus";
import { Users } from "../models/Users";
import { Rooms } from "../models/Rooms";
import { User } from "../interfaces/User";

export const createRoom = async (roomData: Partial<Room>): Promise<Room> => {
  const newRoom: Room = await Rooms.create({
    gameType: roomData.gameType,
    users: roomData.users,
    price: roomData.price,
    isStarted: false,
    isFinished: false,
  });
  return newRoom;
};

export const getRoomById = async (roomId: string): Promise<Room | null> => {
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new Error("Invalid room ID");
  }
  return await Rooms.findById(roomId).populate("users.user");
};

export const getActiveRooms = async (
  gameType?: GameType
): Promise<Room[] | null> => {
  return await Rooms.find({
    isStarted: false,
    isFinished: false,
    gameType: gameType,
  });
};

export const getAllRooms = async (
  page: number = 1,
  limit: number = 10,
  filters: {
    gameType?: GameType;
    isStarted?: boolean;
    isFinished?: boolean;
    price?: number;
  } = {}
): Promise<{
  rooms: Room[];
  total: number;
  totalPages: number;
}> => {
  const query: any = {};

  // Apply filters if they exist
  if (filters.gameType !== undefined) query.gameType = filters.gameType;
  if (filters.isStarted !== undefined) query.isStarted = filters.isStarted;
  if (filters.isFinished !== undefined) query.isFinished = filters.isFinished;
  if (filters.price !== undefined) query.price = filters.price;

  const total = await Rooms.countDocuments(query);
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  const rooms = await Rooms.find(query)
    .populate("users.user")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    rooms,
    total,
    totalPages,
  };
};

export const joinRoomOrCreate = async (
  userId: string,
  gameType: GameType
): Promise<Room | null> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid room ID or user ID");
  }
  const user = await Users.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  let rooms = await getActiveRooms(gameType);
  if (rooms?.length === 0) {
    try {      
      const newRoom = await createRoom({
        gameType: gameType,
        users: [user._id.toString()],
        price: 0,
        isStarted: false,
        isFinished: false,
      });
      const newRooms: Room[] = [newRoom];
      rooms = newRooms;
    } catch (error) {
      console.error('Error creating new room:', error);
    }
  }
  if (!rooms) {
    throw new Error("Bug in Rooms service");
  }

  if (rooms[0].users.length !<= 1) {
    // הוסף את המשתמש לחדר אם הוא עוד לא שם
    if (!rooms[0].users.some(u => u[0] === userId)) {
      await rooms[0].users.push(user._id.toString());
    }
    // פולינג בסיסי - חכה עד שהחדר מתמלא או עד שנגמר הזמן
    const maxWaitTime = 60000; // זמן המתנה מקסימלי: דקה
    const pollInterval = 2000; // בדוק כל 2 שניות
    const startTime = Date.now();
    // פונקציית המתנה פשוטה
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    // לולאת פולינג
    while (Date.now() - startTime < maxWaitTime) {
      // בדוק אם החדר התמלא
      const updatedRoom = await Rooms.findById(rooms[0]._id);
      if (updatedRoom && updatedRoom.users.length === 2) {
        return updatedRoom;
      }
      // המתן לפני הבדיקה הבאה
      await wait(pollInterval);
    }
    // אם הגענו לכאן, זמן ההמתנה הסתיים והחדר עדיין לא מלא
    return rooms[0];
  } else {
    rooms[0].isStarted === true;
    return rooms[0];
  }
};

// End a game and declare winner
export const endGame = async (roomId: string, winnerId: string, loserId: string): Promise<Room | null> => {
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new Error("Invalid room ID or user ID");
  }
  const room = await Rooms.findById(roomId);
  if (!room) {
    throw new Error("Room not found");
  }
  if (!room.isStarted) {
    throw new Error("Game has not started yet");
  }
  if (room.isFinished) {
    throw new Error("Game already finished");
  }
  // Update user win/loss record
  await Users.findByIdAndUpdate(
    winnerId,
    {
      $inc: { wins: 1 },
      status: UserStatus.ACTIVE,
    },
    { new: true }
  );

  // Update user win/loss record
  await Users.findByIdAndUpdate(
    loserId,
    {
      $inc: { losses: 1 },
      status: UserStatus.ACTIVE,
    },
    { new: true }
  );

  return await Rooms.findByIdAndUpdate(
    roomId,
    {
      isFinished: true,
      winner: winnerId,
    },
    { new: true }
  );
};
