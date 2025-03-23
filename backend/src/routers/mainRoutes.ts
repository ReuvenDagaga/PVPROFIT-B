import express from 'express';
import * as UserController from '../controllers/UserController';
import * as RoomController from '../controllers/RoomController';

const router = express.Router();

router.post('/login', UserController.login);
// router.post('/logout', UserController.logout);
router.get('/wallet/:walletAddress', UserController.getUserByWallet);
router.get('/', UserController.getAllUsers);
router.get('/getUserById/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);
router.put('/ScoreAsArrey/:id', UserController.updateUserScoreAsArreyController);
router.put('/updateScore/:id', UserController.updatedUserScore);
router.delete('/:id', UserController.deleteUser);

// Public routes
router.get('/available', RoomController.getActiveRooms);

// Room CRUD operations
router.post('/rooms/', RoomController.joinRoomOrCreate);
router.get('/rooms/:id', RoomController.getRoomById);
router.get('/rooms/', RoomController.getAllRooms);
// router.put('/rooms/:id', RoomController.updateRoom);

// Game operations
router.post('/rooms/:id/end', RoomController.endGame);


export default router;