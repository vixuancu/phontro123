// Express.js type extensions
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any; // Define more specific user type later
      userId?: string;
    }
  }
}