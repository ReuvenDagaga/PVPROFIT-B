"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySolanaSignature = exports.updateWinLoss = exports.updateProfit = exports.updateBalance = exports.getReferredUsers = exports.getAllUsers = exports.deactivateUser = exports.updateUser = exports.getUserByWalletAddress = exports.getUserById = exports.createUser = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Users_1 = require("../models/Users");
const UserStatus_1 = require("../enums/UserStatus");
const bs58_1 = __importDefault(require("bs58"));
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const createUser = (userData, si) => __awaiter(void 0, void 0, void 0, function* () {
    if (!si || si.length > 15) {
        throw new Error('Invalid SI');
    }
    const existingWallet = yield Users_1.Users.findOne({ walletAddress: userData.walletAddress });
    if (existingWallet) {
        throw new Error('Wallet address already in use');
    }
    // Handle referral logic if user was referred
    if (userData.refferedBy) {
        const referrer = yield Users_1.Users.findOne({ refferalCode: userData.refferedBy });
        if (referrer) {
            // Add this user to the referrer's list of referred users after creation
            userData.refferedBy = referrer.refferalCode;
        }
        else {
            // If referral code is invalid, set to null
            userData.refferedBy = "";
        }
    }
    // Create the user
    const newUser = yield Users_1.Users.create({
        username: 'User' + Math.floor(Math.random() * 1000),
        walletAddress: userData.walletAddress,
        ePvpBalance: 100,
        usdtBalance: 0,
        profit: 0,
        isAdmin: false,
        wins: 0,
        losses: 0,
        status: UserStatus_1.UserStatus.ACTIVE,
        refferalCode: Math.random().toString(36).substring(7),
        refferedUsers: []
    });
    // If this user was referred, update the referrer's list of referred users
    if (userData.refferedBy && userData.refferedBy !== "") {
        yield Users_1.Users.findOneAndUpdate({ refferalCode: userData.refferedBy }, { $push: { refferedUsers: newUser._id } });
    }
    return newUser;
});
exports.createUser = createUser;
const getUserById = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }
    return yield Users_1.Users.findById(userId);
});
exports.getUserById = getUserById;
// Get a user by wallet address
const getUserByWalletAddress = (walletAddress) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Users_1.Users.findOne({ walletAddress });
});
exports.getUserByWalletAddress = getUserByWalletAddress;
// Update a user
const updateUser = (userId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(updateData, userId);
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }
    return yield Users_1.Users.findByIdAndUpdate(userId, Object.assign({}, updateData), { new: true, runValidators: true });
});
exports.updateUser = updateUser;
// Deactivate a user (soft delete)
const deactivateUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }
    const result = yield Users_1.Users.findByIdAndUpdate(userId, { status: UserStatus_1.UserStatus.INACTIVE }, { new: true });
    return result !== null;
});
exports.deactivateUser = deactivateUser;
const getAllUsers = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 10) {
    const total = yield Users_1.Users.countDocuments();
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const users = yield Users_1.Users.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    return {
        users,
        total,
        totalPages
    };
});
exports.getAllUsers = getAllUsers;
// Get users referred by a specific user
const getReferredUsers = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }
    const user = yield Users_1.Users.findById(userId).populate('refferedUsers');
    return user === null || user === void 0 ? void 0 : user.refferedUsers;
});
exports.getReferredUsers = getReferredUsers;
// Update user balance
const updateBalance = (userId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }
    return yield Users_1.Users.findByIdAndUpdate(userId, { $inc: { usdtBalance: amount } }, { new: true });
});
exports.updateBalance = updateBalance;
// Update user profit
const updateProfit = (userId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }
    return yield Users_1.Users.findByIdAndUpdate(userId, { $inc: { profit: amount } }, { new: true });
});
exports.updateProfit = updateProfit;
// Update user wins/losses
const updateWinLoss = (userId, isWin) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }
    const updateField = isWin ? { wins: 1 } : { losses: 1 };
    return yield Users_1.Users.findByIdAndUpdate(userId, { $inc: updateField }, { new: true });
});
exports.updateWinLoss = updateWinLoss;
const verifySolanaSignature = (publicKey, message, signature) => {
    try {
        // המרת ההודעה למערך בתים (Uint8Array)
        const messageBytes = new TextEncoder().encode(message);
        // המרת החתימה מפורמט base58 למערך בתים
        const signatureBytes = new Uint8Array(signature);
        // המרת המפתח הציבורי מפורמט base58 למערך בתים
        const publicKeyBytes = bs58_1.default.decode(publicKey);
        // אימות החתימה באמצעות ספריית tweetnacl
        return tweetnacl_1.default.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    }
    catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
};
exports.verifySolanaSignature = verifySolanaSignature;
