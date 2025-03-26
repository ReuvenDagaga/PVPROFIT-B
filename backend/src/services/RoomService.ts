import mongoose, { ObjectId } from "mongoose";
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
  gameType: GameType,
  gamePrice: number
): Promise<Room | null> => {
  // בדיקה שהמשתמש קיים
  const user = await Users.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // ננסה להצטרף לחדר קיים קודם
  let room = await findAvailableRoomAndJoin(userId, gameType);

  // אם אין חדר זמין, ניצור חדר חדש
  if (!room) {
    room = await createNewRoomWithUser(userId, gameType, gamePrice);
    if (!room) {
      throw new Error("Failed to create new room");
    }
  }

  // אם החדר כבר מלא, נחזיר אותו מיד
  if (room.users.length >= 2) {
    return room;
  }

  // אחרת, נחכה עד שהחדר יתמלא
  return await waitForRoomToFill(room._id, 60000, 8000);
};

// פונקציה למציאת חדר זמין והצטרפות אליו
const findAvailableRoomAndJoin = async (userId: string, gameType: GameType): Promise<Room | null> => {
  // נשתמש בפעולת findOneAndUpdate כדי להימנע ממצבי מרוץ
  const room = await Rooms.findOneAndUpdate(
    { 
      gameType, 
      isStarted: false, 
      isFinished: false, 
      users: { $nin: [userId], $size: 1 } // חדר עם משתמש אחד שהוא לא המשתמש הנוכחי
    },
    { 
      $addToSet: { users: userId } // מוסיף את המשתמש רק אם הוא לא קיים כבר
    },
    { 
      new: true, // מחזיר את הדוקומנט המעודכן
      runValidators: true
    }
  );

  return room;
};

// פונקציה ליצירת חדר חדש עם המשתמש
const createNewRoomWithUser = async (userId: string, gameType: GameType, gamePrice: number): Promise<Room | null> => {
  const newRoom = await createRoom({
    gameType,
    users: [userId],
    price: gamePrice,
  });
  
  return newRoom;
};

const waitForRoomToFill = async (
  roomId: string | mongoose.Types.ObjectId,
  maxWaitTime: number,
  pollInterval: number
): Promise<Room | null> => {
  const startTime = Date.now();
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  while (Date.now() - startTime < maxWaitTime) {
    // בדוק אם החדר התמלא
    const currentRoom = await Rooms.findById(roomId);
    
    if (!currentRoom) {
      return null; // החדר נמחק
    }
    
    if (currentRoom.users.length >= 2) {
      // עדכן שהמשחק התחיל ושמור
      currentRoom.isStarted = true;
      await currentRoom.save();
      return currentRoom;
    }    
    // המתן לפני הבדיקה הבאה
    await wait(pollInterval);
  }
  
  // זמן ההמתנה הסתיים
  return null;
};

// End a game and declare winner
export const endGame = async (
  roomId: string,
  winnerId: string,
  loserId: string
): Promise<Room | null> => {
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
