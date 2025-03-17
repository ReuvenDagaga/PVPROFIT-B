"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlayerScore = exports.endGame = exports.startGame = exports.joinRoomOrCreate = exports.getAllRooms = exports.getActiveRooms = exports.getRoomById = exports.createRoom = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const UserStatus_1 = require("../enums/UserStatus");
const Users_1 = require("../models/Users");
const Rooms_1 = require("../models/Rooms");
const createRoom = (roomData) => __awaiter(void 0, void 0, void 0, function* () {
    const newRoom = yield Rooms_1.Rooms.create({
        gameType: roomData.gameType,
        users: roomData.users,
        price: roomData.price,
        isStarted: false,
        isFinished: false,
    });
    return newRoom;
});
exports.createRoom = createRoom;
const getRoomById = (roomId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(roomId)) {
        throw new Error("Invalid room ID");
    }
    return yield Rooms_1.Rooms.findById(roomId).populate("users.user");
});
exports.getRoomById = getRoomById;
const getActiveRooms = (gameType) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Rooms_1.Rooms.find({
        isStarted: false,
        isFinished: false,
        gameType: gameType,
    });
});
exports.getActiveRooms = getActiveRooms;
const getAllRooms = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 10, filters = {}) {
    const query = {};
    // Apply filters if they exist
    if (filters.gameType !== undefined)
        query.gameType = filters.gameType;
    if (filters.isStarted !== undefined)
        query.isStarted = filters.isStarted;
    if (filters.isFinished !== undefined)
        query.isFinished = filters.isFinished;
    if (filters.price !== undefined)
        query.price = filters.price;
    const total = yield Rooms_1.Rooms.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const rooms = yield Rooms_1.Rooms.find(query)
        .populate("users.user")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    return {
        rooms,
        total,
        totalPages,
    };
});
exports.getAllRooms = getAllRooms;
// export const updateRoom = async (
//   roomId: string,
//   updateData: Partial<Room>
// ): Promise<Room | null> => {
//   if (!mongoose.Types.ObjectId.isValid(roomId)) {
//     throw new Error("Invalid room ID");
//   }
//   return await Rooms.findByIdAndUpdate(
//     roomId,
//     { ...updateData },
//     { new: true }
//   );
// };
const joinRoomOrCreate = (userId, gameType) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid room ID or user ID");
    }
    const user = yield Users_1.Users.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    let rooms = yield (0, exports.getActiveRooms)(gameType);
    if ((rooms === null || rooms === void 0 ? void 0 : rooms.length) === 0) {
        try {
            const newRoom = yield (0, exports.createRoom)({
                gameType: gameType,
                users: [{ user: user._id, score: 0 }],
                price: 0,
                isStarted: false,
                isFinished: false,
            });
            const newRooms = [newRoom];
            rooms = newRooms;
        }
        catch (error) {
            console.error('Error creating new room:', error);
        }
    }
    if (!rooms) {
        throw new Error("Bug in Rooms service");
    }
    // אם החדר לא מלא, הוסף את המשתמש ותתחיל פולינג
    if (rooms[0].users.length <= 1) {
        // הוסף את המשתמש לחדר אם הוא עוד לא שם
        if (!rooms[0].users.some(u => u.user.toString() === userId)) {
            yield Rooms_1.Rooms.findByIdAndUpdate(rooms[0]._id, { $push: { users: { user: user._id, score: 0 } } });
        }
        // פולינג בסיסי - חכה עד שהחדר מתמלא או עד שנגמר הזמן
        const maxWaitTime = 60000; // זמן המתנה מקסימלי: דקה
        const pollInterval = 2000; // בדוק כל 2 שניות
        const startTime = Date.now();
        // פונקציית המתנה פשוטה
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        // לולאת פולינג
        while (Date.now() - startTime < maxWaitTime) {
            // בדוק אם החדר התמלא
            const updatedRoom = yield Rooms_1.Rooms.findById(rooms[0]._id);
            if (updatedRoom && updatedRoom.users.length === 2) {
                return updatedRoom;
            }
            // המתן לפני הבדיקה הבאה
            yield wait(pollInterval);
        }
        // אם הגענו לכאן, זמן ההמתנה הסתיים והחדר עדיין לא מלא
        return rooms[0];
    }
    else {
        // החדר כבר מלא, החזר אותו
        return rooms[0];
    }
});
exports.joinRoomOrCreate = joinRoomOrCreate;
// Start a game
const startGame = (roomId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(roomId)) {
        throw new Error("Invalid room ID");
    }
    const room = yield Rooms_1.Rooms.findById(roomId);
    if (!room) {
        throw new Error("Room not found");
    }
    if (room.isStarted) {
        throw new Error("Game already started");
    }
    if (room.users.length < 2) {
        throw new Error("Not enough players to start the game");
    }
    return yield Rooms_1.Rooms.findByIdAndUpdate(roomId, { isStarted: true }, { new: true });
});
exports.startGame = startGame;
// End a game and declare winner
const endGame = (roomId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(roomId)) {
        throw new Error("Invalid room ID or user ID");
    }
    const room = yield Rooms_1.Rooms.findById(roomId);
    if (!room) {
        throw new Error("Room not found");
    }
    if (!room.isStarted) {
        throw new Error("Game has not started yet");
    }
    if (room.isFinished) {
        throw new Error("Game already finished");
    }
    const theWinner = room.users[0].score > room.users[1].score
        ? room.users[0].user
        : room.users[1].user;
    const theLoser = room.users[0].score > room.users[1].score
        ? room.users[1].user
        : room.users[0].user;
    // Update user win/loss record
    yield Users_1.Users.findByIdAndUpdate(theWinner, {
        $inc: { wins: 1 },
        status: UserStatus_1.UserStatus.ACTIVE,
    }, { new: true });
    // Update user win/loss record
    yield Users_1.Users.findByIdAndUpdate(theLoser, {
        $inc: { losses: 1 },
        status: UserStatus_1.UserStatus.ACTIVE,
    }, { new: true });
    return yield Rooms_1.Rooms.findByIdAndUpdate(roomId, {
        isFinished: true,
        winner: theWinner,
    }, { new: true });
});
exports.endGame = endGame;
// Update player score
const updatePlayerScore = (roomId, userId, score) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(roomId) ||
        !mongoose_1.default.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid room ID or user ID");
    }
    const room = yield Rooms_1.Rooms.findById(roomId);
    if (!room) {
        throw new Error("Room not found");
    }
    if (!room.isStarted || room.isFinished) {
        throw new Error("Game is not in progress");
    }
    return yield Rooms_1.Rooms.findOneAndUpdate({ _id: roomId, "users.user": userId }, { $set: { "users.$.score": score } }, { new: true });
});
exports.updatePlayerScore = updatePlayerScore;
