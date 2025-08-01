// Express.js type extensions
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any; //
      userId?: string;
    }
  }
}