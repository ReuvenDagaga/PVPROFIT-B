"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlayerScore = exports.endGame = exports.startGame = exports.joinRoomOrCreate = exports.getAllRooms = exports.getActiveRooms = exports.getRoomById = void 0;
const RoomService = __importStar(require("../services/RoomService"));
const getRoomById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.params.id;
        const room = yield RoomService.getRoomById(roomId);
        if (!room) {
            res.status(404).json({ success: false, message: 'Room not found' });
            return;
        }
        res.status(200).json({
            success: true,
            data: room
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to get room'
        });
    }
});
exports.getRoomById = getRoomById;
const getActiveRooms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const gameType = req.query.gameType;
        const rooms = yield RoomService.getActiveRooms(gameType);
        res.status(200).json({
            success: true,
            data: rooms
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to get active rooms'
        });
    }
});
exports.getActiveRooms = getActiveRooms;
const getAllRooms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filters = {};
        if (req.query.gameType) {
            filters.gameType = req.query.gameType;
        }
        if (req.query.isStarted !== undefined) {
            filters.isStarted = req.query.isStarted === 'true';
        }
        if (req.query.isFinished !== undefined) {
            filters.isFinished = req.query.isFinished === 'true';
        }
        if (req.query.price !== undefined) {
            filters.price = parseInt(req.query.price);
        }
        const { rooms, total, totalPages } = yield RoomService.getAllRooms(page, limit, filters);
        res.status(200).json({
            success: true,
            count: rooms.length,
            total,
            totalPages,
            currentPage: page,
            data: rooms
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to get rooms'
        });
    }
});
exports.getAllRooms = getAllRooms;
// export const updateRoom = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const roomId = req.params.id;
//     const updateData = req.body;
//     const updatedRoom = await RoomService.updateRoom(roomId, updateData);
//     if (!updatedRoom) {
//       res.status(404).json({ success: false, message: 'Room not found' });
//       return;
//     }
//     res.status(200).json({
//       success: true,
//       data: updatedRoom
//     });
//   } catch (error: any) {
//     res.status(400).json({
//       success: false,
//       message: error.message || 'Failed to update room'
//     });
//   }
// };
const joinRoomOrCreate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.body.userId;
        const gameType = req.body.gameType;
        if (!userId || !gameType) {
            res.status(400).json({
                success: false,
                message: 'User ID and game type are required'
            });
            return;
        }
        const room = yield RoomService.joinRoomOrCreate(userId, gameType);
        res.status(200).json({
            success: true,
            data: room
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to join or create room'
        });
    }
});
exports.joinRoomOrCreate = joinRoomOrCreate;
const startGame = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.params.id;
        const updatedRoom = yield RoomService.startGame(roomId);
        res.status(200).json({
            success: true,
            data: updatedRoom
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to start game'
        });
    }
});
exports.startGame = startGame;
const endGame = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.params.id;
        const updatedRoom = yield RoomService.endGame(roomId);
        res.status(200).json({
            success: true,
            data: updatedRoom
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to end game'
        });
    }
});
exports.endGame = endGame;
const updatePlayerScore = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.params.id;
        const { userId, score } = req.body;
        if (!userId || score === undefined) {
            res.status(400).json({
                success: false,
                message: 'User ID and score are required'
            });
            return;
        }
        const updatedRoom = yield RoomService.updatePlayerScore(roomId, userId, score);
        res.status(200).json({
            success: true,
            data: updatedRoom
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update player score'
        });
    }
});
exports.updatePlayerScore = updatePlayerScore;
