// Express.js type extensions
import { Request } from "express";
import { Server } from "socket.io";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      userId?: string;
      io?: Server;
    }
  }
}

// JWT payload type
export interface JwtPayload {
  id: string;
  email?: string;
  iat?: number; // Issued at time - thời điểm bắt đầu token
  exp?: number; // Expiration time - thời điểm hết hạn token
}
