import crypto from 'crypto';

export const generateReferralCode = (username: string): string => {

    const prefix = username.substring(0, 4).toUpperCase();
  
  const randomString = crypto.randomBytes(3).toString('hex');
  
  return `${prefix}-${randomString}`;
};