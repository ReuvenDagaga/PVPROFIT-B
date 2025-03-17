"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdmin = exports.verifyUser = exports.generateAuthToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret_key';
const generateAuthToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user._id }, SECRET_KEY, {
        expiresIn: '1h'
    });
};
exports.generateAuthToken = generateAuthToken;
const verifyUser = (req, res, next) => {
    if (!req.headers.cookie) {
        return res.status(401).json({
            status: 'error',
            message: 'Access denied. No cookies found.'
        });
    }
    const tokenApi = req.cookies['token'];
    if (!tokenApi) {
        return res.status(401).json({
            status: 'error',
            message: 'Access denied. No token provided.'
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(tokenApi, SECRET_KEY, {
            algorithms: ['HS256']
        });
        req.score = decoded;
        next();
    }
    catch (error) {
        console.error('Token verification error:', error);
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                status: 'error',
                message: 'Token expired. Please log in again.'
            });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid or malformed token.'
            });
        }
        return res.status(500).json({
            status: 'error',
            message: 'Internal error during authentication.'
        });
    }
};
exports.verifyUser = verifyUser;
// Admin check middleware
const verifyAdmin = (req, res, next) => {
    // First verify that the user is authenticated
    verifyUser(req, res, () => {
        // Check if user exists and is admin
        const user = req.user;
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin privileges required.'
            });
        }
        // User is admin, proceed
        next();
    });
};
exports.verifyAdmin = verifyAdmin;
