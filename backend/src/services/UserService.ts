import mongoose from 'mongoose';
import { Users } from '../models/Users';
import { UserStatus } from '../enums/UserStatus';
import { User } from '../interfaces/User';
import base58 from 'bs58';
import nacl from 'tweetnacl';

export const createUser = async (userData: Partial<User>, si: string): Promise<User> => {
  
    if (!si || si.length !> 15) {
        throw new Error('Invalid SI');
    }    

    const existingWallet = await Users.findOne({ walletAddress: userData.walletAddress });
    
    if (existingWallet) {
      throw new Error('Wallet address already in use');
    }

    // Handle referral logic if user was referred
    if (userData.refferedBy) {
      const referrer = await Users.findOne({ refferalCode: userData.refferedBy });
      if (referrer) {
        // Add this user to the referrer's list of referred users after creation
        userData.refferedBy = referrer.refferalCode;
      } else {
        // If referral code is invalid, set to null
        userData.refferedBy = "";
      }
    }
    // Create the user
    const newUser: User = await Users.create({
      username: 'User' + Math.floor(Math.random() * 1000),
      walletAddress: userData.walletAddress,
      ePvpBalance: 1000,
      usdtBalance: 100,
      profit: 0,
      isAdmin: false,
      wins: 0,
      score: 0,
      turn: false,
      scoreAsArrey: [],
      losses: 0,
      status: UserStatus.ACTIVE,
      refferalCode: Math.random().toString(36).substring(7),
      refferedUsers: []
    });

    // If this user was referred, update the referrer's list of referred users
    if (userData.refferedBy && userData.refferedBy !== "") {
      await Users.findOneAndUpdate(
        { refferalCode: userData.refferedBy },
        { $push: { refferedUsers: newUser._id } }
      );
    }
    return newUser;
  }
  
  export const getUserById = async (userId: string): Promise<User | null> => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    return await Users.findById(userId);
  }

  export const getUserByWalletAddress = async (walletAddress: string): Promise<User | null> => {
    return await Users.findOne({ walletAddress });
  }

  export const updateUser = async (userId: string, updateData: Partial<User>): Promise<User | null> => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    const a = await Users.findByIdAndUpdate(
      userId,
      { ...updateData },
      { new: true }
    );    
    return a
  }

    export const updateUserScoreAsArrey = async (userId: string, scoreAsArrey: Partial<User>): Promise<User | null> => {      
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }
      const a = await Users.findByIdAndUpdate(
        userId,
        { scoreAsArrey: scoreAsArrey },
        { new: true }
      );      
      return a
    }

  export const deactivateUser = async (userId: string): Promise<boolean> => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const result = await Users.findByIdAndUpdate(
      userId,
      { status: UserStatus.INACTIVE },
      { new: true }
    );

    return result !== null;
  }

  export const getAllUsers = async (page: number = 1, limit: number = 10): Promise<{
    users: User[];
    total: number;
    totalPages: number;
  }> => {
    const total = await Users.countDocuments();
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const users = await Users.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      users,
      total,
      totalPages
    };
  }

  export const getReferredUsers = async (userId: string): Promise<mongoose.Types.ObjectId[]> => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    const user = await Users.findById(userId).populate('refferedUsers');
    return user?.refferedUsers as mongoose.Types.ObjectId[];
  }

  // Update user balance
  export const updateBalance = async (userId: string, amount: number): Promise<User | null> => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    return await Users.findByIdAndUpdate(
      userId,
      { $inc: { usdtBalance: amount } },
      { new: true }
    );
  }

    export const updateScore = async (userId: string, score: number): Promise<User | null> => {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }
  
      return await Users.findByIdAndUpdate(
        userId,
        { $inc: { score: score } },
        { new: true }
      );
    }

  // Update user profit
  export const updateProfit = async (userId: string, amount: number): Promise<User | null> => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    return await Users.findByIdAndUpdate(
      userId,
      { $inc: { profit: amount } },
      { new: true }
    );
  }

  // Update user wins/losses
  export const updateWinLoss = async (userId: string, isWin: boolean): Promise<User | null> => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const updateField = isWin ? { wins: 1 } : { losses: 1 };
    
    return await Users.findByIdAndUpdate(
      userId,
      { $inc: updateField },
      { new: true }
    );
  }

  export const verifySolanaSignature = (publicKey: string, message: string, signature: number[]): boolean => {
    try {
      // המרת ההודעה למערך בתים (Uint8Array)
      const messageBytes = new TextEncoder().encode(message);
      
      // המרת החתימה מפורמט base58 למערך בתים
      const signatureBytes = new Uint8Array(signature);
      
      // המרת המפתח הציבורי מפורמט base58 למערך בתים
      const publicKeyBytes = base58.decode(publicKey);
  
      // אימות החתימה באמצעות ספריית tweetnacl
      return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  export const getUserByReferralCodeService = async (refferalCode: string): Promise<User | null> => {
    const user = await Users.findOne({ refferalCode });
    console.log(user);
    
    return user;
  }