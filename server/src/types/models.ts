import { Document, Types } from 'mongoose';

// Base interface for all models - extending Document already includes _id, createdAt, updatedAt
export interface BaseModel extends Document {
  createdAt: Date;
  updatedAt: Date;
}

// User model interface
export interface IUser extends BaseModel {
  fullName: string;
  email: string;
  password: string;
  address: string;
  avatar: string;
  phone: string;
  isAdmin: boolean;
  isActive: boolean;
  balance: number;
  typeLogin: 'email' | 'google';
}

// Post model interface
export interface IPost extends BaseModel {
  title: string;
  price: number;
  description: string;
  images: string[];
  userId: string;
  category: 'phong-tro' | 'nha-nguyen-can' | 'can-ho-chung-cu' | 'can-ho-mini';
  location: string;
  phone: string;
  username: string;
  area: number;
  options: any; // Mixed type from mongoose
  status: 'active' | 'inactive';
  typeNews: 'vip' | 'normal';
  endDate: Date;
}

// Message model interface (based on the file name)
export interface IMessage extends BaseModel {
  senderId: string;
  receiverId: string;
  message: string;
  status: string;
  isRead: boolean;
}

// Favourite model interface
export interface IFavourite extends BaseModel {
  userId: string;
  postId: string;
}

// OTP model interface  
export interface IOtp extends BaseModel {
  email: string;
  otp: string;
  time: Date;
  type: 'forgotPassword' | 'verifyAccount';
}

// Recharge model interface
export interface IRechargeUser extends BaseModel {
  userId: string;
  amount: number;
  typePayment: string;
  status: string;
}

// API Key model interface
export interface IApiKey extends BaseModel {
  userId: string;
  publicKey: string;
  privateKey: string;
}

// Keyword Search model interface
export interface IKeywordSearch extends BaseModel {
  title: string;
  count: number;
}