import { Request, Response } from "express";
import * as RoomService from "../services/RoomService";
import { GameType } from "../enums/GameType";

export const getRoomById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const roomId = req.params.id;
    const room = await RoomService.getRoomById(roomId);
    if (!room) {
      res.status(404).json({ success: false, message: "Room not found" });
      return;
    }
    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to get room",
    });
  }
};

export const getActiveRooms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const gameType = req.query.gameType as GameType | undefined;
    const rooms = await RoomService.getActiveRooms(gameType);
    res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to get active rooms",
    });
  }
};

export const getAllRooms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters: any = {};

    if (req.query.gameType) {
      filters.gameType = req.query.gameType as GameType;
    }

    if (req.query.isStarted !== undefined) {
      filters.isStarted = req.query.isStarted === "true";
    }

    if (req.query.isFinished !== undefined) {
      filters.isFinished = req.query.isFinished === "true";
    }

    if (req.query.price !== undefined) {
      filters.price = parseInt(req.query.price as string);
    }

    const { rooms, total, totalPages } = await RoomService.getAllRooms(
      page,
      limit,
      filters
    );

    res.status(200).json({
      success: true,
      count: rooms.length,
      total,
      totalPages,
      currentPage: page,
      data: rooms,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to get rooms",
    });
  }
};

export const joinRoomOrCreate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.body.userId;
    const gameType = req.body.gameType as GameType;

    if (!userId || !gameType) {
      res.status(400).json({
        success: false,
        message: "User ID and game type are required",
      });
      return;
    }
    const room = await RoomService.joinRoomOrCreate(userId, gameType);
    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to join or create room",
    });
  }
};

export const endGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId, winnerId, loserId } = req.body;
    const updatedRoom = await RoomService.endGame(roomId, winnerId, loserId);

    res.status(200).json({
      success: true,
      data: updatedRoom,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to end game",
    });
  }
};
