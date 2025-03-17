import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface TokenPayload {
  id: string;
  isAdmin: boolean;
}

const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret_key';
const generateAuthToken = (user: { _id: any }): string => {
  return jwt.sign(
    { id: user._id }, 
    SECRET_KEY, 
    { 
      expiresIn: '1h'
    }
  );
};

const verifyUser = (req: Request, res: Response, next: NextFunction) => {
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
    const decoded = jwt.verify(tokenApi, SECRET_KEY, {
      algorithms: ['HS256']
    }) as TokenPayload;
    (req as any).score = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Token expired. Please log in again.' 
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
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


// Admin check middleware
const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
  // First verify that the user is authenticated
  verifyUser(req, res, () => {
    // Check if user exists and is admin
    const user = (req as any).user;
    
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

export { generateAuthToken, verifyUser, verifyAdmin };