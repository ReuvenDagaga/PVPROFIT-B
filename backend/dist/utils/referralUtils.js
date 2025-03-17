"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReferralCode = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateReferralCode = (username) => {
    const prefix = username.substring(0, 4).toUpperCase();
    const randomString = crypto_1.default.randomBytes(3).toString('hex');
    return `${prefix}-${randomString}`;
};
exports.generateReferralCode = generateReferralCode;
