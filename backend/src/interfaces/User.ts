import mongoose from "mongoose";
import { UserStatus } from "../enums/UserStatus";

export interface User {
  _id: mongoose.Types.ObjectId;
  username: string;
  walletAddress: string;
  ePvpBalance: number;
  usdtBalance: number;
  profit: number;
  score: number;
  turn: boolean;
  scoreAsArrey: number[],
  isAdmin: boolean;
  wins: number;
  losses: number;
  status: UserStatus;
  refferalCode: string;
  refferedBy?: string;
  refferedUsers?: mongoose.Types.ObjectId[];
}
