import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: '24h' as const,
};

export const generateToken = (payload: string | object | Buffer): string => {
  return jwt.sign(payload, JWT_CONFIG.secret as string, {
    expiresIn: '24h', // Use string literal directly
  });
};

export const verifyToken = (token: string): string | JwtPayload => {
  try {
    return jwt.verify(token, JWT_CONFIG.secret as string);
  } catch (error) {
    throw new Error('Invalid token');
  }
};