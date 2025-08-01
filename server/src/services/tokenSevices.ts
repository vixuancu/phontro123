import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import ApiKey from '../models/apiKey.model';
import { BadUserRequestError } from '../core/error.response';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from '../types/express';
import dotenv from 'dotenv';

dotenv.config();

interface TokenPayload extends JwtPayload {
  id: string;
  email?: string;
}

interface DecodedToken {
  id: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export const createApiKey = async (userId: string) => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { 
    modulusLength: 2048 
  });

  const privateKeyString = privateKey.export({ 
    type: 'pkcs8', 
    format: 'pem' 
  }) as string;
  
  const publicKeyString = publicKey.export({ 
    type: 'spki', 
    format: 'pem' 
  }) as string;

  const newApiKey = new ApiKey({ 
    userId, 
    publicKey: publicKeyString, 
    privateKey: privateKeyString 
  });
  
  return await newApiKey.save();
};

export const createToken = async (payload: TokenPayload): Promise<string> => {
  const findApiKey = await ApiKey.findOne({ userId: payload.id.toString() });

  if (!findApiKey?.privateKey) {
    throw new Error('Private key not found for user');
  }

  return jwt.sign(payload, findApiKey.privateKey, {
    algorithm: 'RS256', // Important: Must specify algorithm when using RSA
    expiresIn: '15m',
  });
};

export const createRefreshToken = async (payload: TokenPayload): Promise<string> => {
  const findApiKey = await ApiKey.findOne({ userId: payload.id.toString() });

  if (!findApiKey?.privateKey) {
    throw new Error('Private key not found for user');
  }

  return jwt.sign(payload, findApiKey.privateKey, {
    algorithm: 'RS256',
    expiresIn: '7d',
  });
};

export const verifyToken = async (token: string): Promise<DecodedToken> => {
  try {
    const { id } = jwtDecode<DecodedToken>(token);
    const findApiKey = await ApiKey.findOne({ userId: id });

    if (!findApiKey) {
      throw new BadUserRequestError('Vui lòng đăng nhập lại');
    }

    const decoded = jwt.verify(token, findApiKey.publicKey, {
      algorithms: ['RS256'],
    }) as DecodedToken;

    return decoded;
  } catch (error) {
    throw new BadUserRequestError('Vui lòng đăng nhập lại');
  }
};