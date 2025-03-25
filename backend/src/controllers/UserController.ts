import e, { Request, Response } from "express";
import * as UserService from "../services/UserService";
import { generateReferralCode } from "../utils/referralUtils";
import { UserStatus } from "../enums/UserStatus";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress, signature, message } = req.body;
    if (!walletAddress || !signature) {
      res.status(400).json({
        success: false,
        message: "Wallet address, signature, and message are required",
      });
      return;
    }

    // Get user by wallet address
    let user = await UserService.getUserByWalletAddress(walletAddress);
    if (!user) {
      const { refferedBy } = req.params;
      refferedBy
        ? (user = await UserService.createUser(
            { walletAddress, refferedBy },
            signature
          ))
        : (user = await UserService.createUser({ walletAddress }, signature));
    }
    if (!user) {
      res.status(400).json({
        success: false,
        message: "User not found or account not created",
      });
      return;
    }
    // Check if user is active
    if (user.status === UserStatus.INACTIVE) {
      res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact support.",
      });
      return;
    }

    // Verify Solana wallet signature
    const isSignatureValid = UserService.verifySolanaSignature(
      walletAddress,
      message,
      signature.data
    );
    if (!isSignatureValid) {
      res.status(401).json({
        success: false,
        message: "Invalid signature",
      });
      return;
    }
    // Generate a simple token (just for testing)
    const token = jwt.sign(
      {
        id: user._id.toString(),
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET || "test_secret_key",
      { expiresIn: "30d" }
    );

    res.status(200).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to login",
    });
  }
};

// Get a user by ID
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;
    const user = await UserService.getUserById(userId);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to get user",
    });
  }
};

// Get a user by wallet address
export const getUserByWallet = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { walletAddress } = req.params;
    const user = await UserService.getUserByWalletAddress(walletAddress);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to get user",
    });
  }
};

export const updatedUserScore = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;
    const score = req.body.score;
    console.log(score, id);

    const updatedUser = await UserService.updateScore(id, score);

    if (!updatedUser) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update user score",
    });
  }
};

// Update a user
export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    // Prevent updating critical fields directly
    delete updateData.refferalCode;
    delete updateData.walletAddress;
    delete updateData.isAdmin;

    const updatedUser = await UserService.updateUser(userId, updateData);

    if (!updatedUser) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update user",
    });
  }
};

// Update a user
export const updateUserScoreAsArreyController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;
    const ScoreAsArrey = req.body;
    const updatedUser = await UserService.updateUserScoreAsArrey(
      userId,
      ScoreAsArrey
    );

    if (!updatedUser) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update user",
    });
  }
};

// Delete a user (change status to inactive)
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;
    const deleted = await UserService.deactivateUser(userId);

    if (!deleted) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete user",
    });
  }
};

// Get all users (with pagination)
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { users, total, totalPages } = await UserService.getAllUsers(
      page,
      limit
    );

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages,
      currentPage: page,
      data: users,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to get users",
    });
  }
};

export const getUserByReferralCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {password} = req.params;    
    const user = await UserService.getUserByReferralCodeService(password);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: true,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
    });
  }
};
