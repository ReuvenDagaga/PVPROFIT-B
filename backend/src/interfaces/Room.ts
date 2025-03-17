import mongoose from "mongoose";
import { GameType } from "../enums/GameType";

export interface Room {
    _id: mongoose.Types.ObjectId;
    gameType: GameType;
    users: string[];
    price: number;
    isStarted?: boolean;
    isFinished?: boolean;
    winner?: string;
}
