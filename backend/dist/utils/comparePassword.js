"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.generateUserPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const generateUserPassword = (password) => {
    return bcrypt_1.default.hashSync(password, 10);
};
exports.generateUserPassword = generateUserPassword;
const comparePassword = (password, anotherPassword) => {
    return bcrypt_1.default.compareSync(password, anotherPassword);
};
exports.comparePassword = comparePassword;
