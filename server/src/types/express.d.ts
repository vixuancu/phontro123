// Express.js type extensions
import { Request } from 'express';
import { Server } from 'socket.io';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
      io?: Server;
    }
  }
}