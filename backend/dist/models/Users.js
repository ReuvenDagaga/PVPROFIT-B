"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Users = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const UserStatus_1 = require("../enums/UserStatus");
const usersSchema = new mongoose_1.default.Schema({
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
    status: {
        type: String,
        enum: Object.values(UserStatus_1.UserStatus),
        default: UserStatus_1.UserStatus.ACTIVE,
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
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
        }],
}, {
    timestamps: true,
});
exports.Users = mongoose_1.default.model('Users', usersSchema);
