import { Request, Response, NextFunction } from 'express';
import { BadUserRequestError, BadUser2RequestError } from '../core/error.response';
import { verifyToken } from '../services/tokenSevices';
import User from '../models/users.model';

// Async handler utility
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// User authentication middleware
export const authUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      throw new BadUserRequestError('Vui lòng đăng nhập');
    }

    const decoded = await verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

// Admin authentication middleware
export const authAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      throw new BadUserRequestError('Bạn không có quyền truy cập');
    }

    const decoded = await verifyToken(token);
    const { id } = decoded;
    
    const findUser = await User.findById(id);
    
    if (!findUser || findUser.isAdmin === false) {
      throw new BadUser2RequestError('Bạn không có quyền truy cập');
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};