import mongoose, { Schema, Document } from "mongoose";
import { GameType } from "../enums/GameType";
import { Room } from "../interfaces/Room";

const RoomSchema = new Schema(
  {
    gameType: {
      type: String,
      enum: Object.values(GameType),
      required: true,
    },
    users: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    isStarted: {
      type: Boolean,
      default: false,
    },
    isFinished: {
      type: Boolean,
      default: false,
    },
    winner: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Rooms = mongoose.model<Room>("Rooms", RoomSchema);
