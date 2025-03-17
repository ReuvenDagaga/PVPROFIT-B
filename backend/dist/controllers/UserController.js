"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getAllUsers = exports.deleteUser = exports.updateUser = exports.getUserByWallet = exports.getUserById = exports.login = void 0;
const UserService = __importStar(require("../services/UserService"));
const UserStatus_1 = require("../enums/UserStatus");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { walletAddress, signature, message } = req.body;
        if (!walletAddress || !signature) {
            res.status(400).json({
                success: false,
                message: 'Wallet address, signature, and message are required'
            });
            return;
        }
        // Get user by wallet address
        let user = yield UserService.getUserByWalletAddress(walletAddress);
        if (!user) {
            const { refferedBy } = req.params;
            refferedBy ? user = yield UserService.createUser({ walletAddress, refferedBy }, signature) : user = yield UserService.createUser({ walletAddress }, signature);
        }
        if (!user) {
            res.status(400).json({
                success: false,
                message: 'User not found or account not created'
            });
            return;
        }
        // Check if user is active
        if (user.status === UserStatus_1.UserStatus.INACTIVE) {
            res.status(403).json({
                success: false,
                message: 'Your account is inactive. Please contact support.'
            });
            return;
        }
        // Verify Solana wallet signature
        const isSignatureValid = UserService.verifySolanaSignature(walletAddress, message, signature.data);
        if (!isSignatureValid) {
            res.status(401).json({
                success: false,
                message: 'Invalid signature'
            });
            return;
        }
        // Generate a simple token (just for testing)
        const token = jsonwebtoken_1.default.sign({
            id: user._id.toString(),
            isAdmin: user.isAdmin
        }, process.env.JWT_SECRET || 'test_secret_key', { expiresIn: '30d' });
        res.status(200).json({
            success: true,
            data: {
                user,
                token
            }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to login'
        });
    }
});
exports.login = login;
// Get a user by ID
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const user = yield UserService.getUserById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.status(200).json({
            success: true,
            data: user
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to get user'
        });
    }
});
exports.getUserById = getUserById;
// Get a user by wallet address
const getUserByWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { walletAddress } = req.params;
        const user = yield UserService.getUserByWalletAddress(walletAddress);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.status(200).json({
            success: true,
            data: user
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to get user'
        });
    }
});
exports.getUserByWallet = getUserByWallet;
// Update a user
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const updateData = req.body;
        // Prevent updating critical fields directly
        delete updateData.refferalCode;
        delete updateData.walletAddress;
        delete updateData.isAdmin;
        const updatedUser = yield UserService.updateUser(userId, updateData);
        if (!updatedUser) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.status(200).json({
            success: true,
            data: updatedUser
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update user'
        });
    }
});
exports.updateUser = updateUser;
// Delete a user (change status to inactive)
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const deleted = yield UserService.deactivateUser(userId);
        if (!deleted) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'User deactivated successfully'
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to delete user'
        });
    }
});
exports.deleteUser = deleteUser;
// Get all users (with pagination)
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { users, total, totalPages } = yield UserService.getAllUsers(page, limit);
        res.status(200).json({
            success: true,
            count: users.length,
            total,
            totalPages,
            currentPage: page,
            data: users
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to get users'
        });
    }
});
exports.getAllUsers = getAllUsers;
