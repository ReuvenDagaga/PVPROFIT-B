import mongoose from "mongoose";
import { UserStatus } from "../enums/UserStatus";
import { User } from "../interfaces/User";

const usersSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    walletAddress: {
      type: String,
      required: true,
      unique: true,
    },
    ePvpBalance: {
      type: Number,
      default: 0,
    },
    usdtBalance: {
      type: Number,
      default: 0,
    },
    profit: {
      type: Number,
      default: 0,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    scoreAsArrey: {
      type: [Number],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
    turn: {
      type: Boolean,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
    refferalCode: {
      type: String,
      unique: true,
    },
    refferedBy: {
      type: String,
      default: "",
    },
    refferedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);


export const Users = mongoose.model<User>('Users', usersSchema);

