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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserController = __importStar(require("../controllers/UserController"));
const RoomController = __importStar(require("../controllers/RoomController"));
const router = express_1.default.Router();
router.post('/login', UserController.login);
// router.post('/logout', UserController.logout);
router.get('/wallet/:walletAddress', UserController.getUserByWallet);
router.get('/', UserController.getAllUsers);
router.get('/getUserById/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);
// Public routes
router.get('/available', RoomController.getActiveRooms);
// Room CRUD operations
router.post('/rooms/', RoomController.joinRoomOrCreate);
router.get('/rooms/:id', RoomController.getRoomById);
router.get('/rooms/', RoomController.getAllRooms);
// router.put('/rooms/:id', RoomController.updateRoom);
// Game operations
router.post('/:id/start', RoomController.startGame);
router.post('/rooms/:id/end', RoomController.endGame);
router.post('/rooms/:id/score', RoomController.updatePlayerScore);
exports.default = router;
