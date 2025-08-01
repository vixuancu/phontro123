import { Request, Response } from 'express';
import User from '../models/users.model';
import ApiKey from '../models/apiKey.model';
import RechargeUser from '../models/RechargeUser.model';
import Post from '../models/post.model';
import KeywordSearch from '../models/keyWordSearch.model';
import Otp from '../models/otp.model';

// Import utilities and services
const sendMailForgotPassword = require('../utils/SendMail/sendMailForgotPassword');
import { BadRequestError } from '../core/error.response';
import { createApiKey, createToken, createRefreshToken, verifyToken } from '../services/tokenSevices';
import { Created, OK } from '../core/success.response';

import bcrypt from 'bcrypt';
import CryptoJS from 'crypto-js';
import jwt from 'jsonwebtoken';
import otpGenerator from 'otp-generator';
import { jwtDecode } from 'jwt-decode';

const { AiSearchKeyword } = require('../utils/AISearch/AISearch');

interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
  avatar?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

class ControllerUsers {
  async register(req: Request, res: Response): Promise<void> {
    const { fullName, email, password, phone }: RegisterRequest = req.body;

    if (!fullName || !email || !password || !phone) {
      throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError('Người dùng đã tồn tại');
    }

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const passwordHash = bcrypt.hashSync(password, salt);
    
    const newUser = await User.create({
      fullName,
      email,
      password: passwordHash,
      typeLogin: 'email',
      phone,
      address: req.body.address || '',
      avatar: req.body.avatar || '',
      isAdmin: false,
      isActive: false,
      balance: 0,
    });

    const userId = (newUser._id as any).toString();
    await createApiKey(userId);
    const token = await createToken({ id: userId });
    const refreshToken = await createRefreshToken({ id: userId });

    // Set secure cookies
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('logged', '1', {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    new Created({ 
      message: 'Đăng ký thành công', 
      metadata: { token, refreshToken } 
    }).send(res);
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password }: LoginRequest = req.body;
    
    if (!email || !password) {
      throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
    }

    if (user.typeLogin === 'google') {
      throw new BadRequestError('Tài khoản đăng nhập bằng google');
    }

    const checkPassword = bcrypt.compareSync(password, user.password);
    if (!checkPassword) {
      throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
    }

    const userId = (user._id as any).toString();
    await createApiKey(userId);
    const token = await createToken({ id: userId });
    const refreshToken = await createRefreshToken({ id: userId });

    // Set secure cookies
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('logged', '1', {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    new OK({ 
      message: 'Đăng nhập thành công', 
      metadata: { 
        token, 
        refreshToken,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          isAdmin: user.isAdmin
        }
      } 
    }).send(res);
  }

  async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    res.clearCookie('logged');
    
    new OK({ message: 'Đăng xuất thành công' }).send(res);
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new BadRequestError('Không tìm thấy thông tin người dùng');
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      throw new BadRequestError('Không tìm thấy người dùng');
    }

    new OK({ 
      message: 'Lấy thông tin thành công', 
      metadata: { user } 
    }).send(res);
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new BadRequestError('Không tìm thấy thông tin người dùng');
    }

    const allowedUpdates = ['fullName', 'phone', 'address', 'avatar'];
    const updates: any = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new BadRequestError('Không tìm thấy người dùng');
    }

    new OK({ 
      message: 'Cập nhật thông tin thành công', 
      metadata: { user } 
    }).send(res);
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new BadRequestError('Không tìm thấy thông tin người dùng');
    }

    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;
    
    if (!currentPassword || !newPassword) {
      throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new BadRequestError('Không tìm thấy người dùng');
    }

    const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestError('Mật khẩu hiện tại không chính xác');
    }

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const newPasswordHash = bcrypt.hashSync(newPassword, salt);

    user.password = newPasswordHash;
    await user.save();

    new OK({ message: 'Đổi mật khẩu thành công' }).send(res);
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    
    if (!email) {
      throw new BadRequestError('Vui lòng nhập email');
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new BadRequestError('Email không tồn tại trong hệ thống');
    }

    // Generate OTP
    const otp = otpGenerator.generate(6, { 
      upperCaseAlphabets: false, 
      lowerCaseAlphabets: false, 
      specialChars: false 
    });

    // Save OTP to database
    await Otp.create({
      email,
      otp,
      type: 'forgotPassword',
      time: new Date()
    });

    // Send OTP via email
    await sendMailForgotPassword(email, otp);

    new OK({ message: 'Mã OTP đã được gửi đến email của bạn' }).send(res);
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }

    const otpRecord = await Otp.findOne({ 
      email, 
      otp, 
      type: 'forgotPassword' 
    });

    if (!otpRecord) {
      throw new BadRequestError('Mã OTP không hợp lệ');
    }

    // Check if OTP is expired (assuming 5 minutes expiry)
    const now = new Date();
    const otpAge = (now.getTime() - otpRecord.time.getTime()) / 1000 / 60;
    
    if (otpAge > 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw new BadRequestError('Mã OTP đã hết hạn');
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { email, otpId: otpRecord._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '10m' }
    );

    res.cookie('tokenResetPassword', resetToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    new OK({ 
      message: 'Xác thực OTP thành công', 
      metadata: { resetToken } 
    }).send(res);
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { newPassword } = req.body;
    const resetToken = req.cookies.tokenResetPassword;
    
    if (!newPassword) {
      throw new BadRequestError('Vui lòng nhập mật khẩu mới');
    }

    if (!resetToken) {
      throw new BadRequestError('Token reset không hợp lệ');
    }

    try {
      const decoded = jwt.verify(
        resetToken, 
        process.env.JWT_SECRET || 'fallback-secret'
      ) as { email: string; otpId: string };

      const user = await User.findOne({ email: decoded.email });
      if (!user) {
        throw new BadRequestError('Người dùng không tồn tại');
      }

      // Hash new password
      const saltRounds = 10;
      const salt = bcrypt.genSaltSync(saltRounds);
      const passwordHash = bcrypt.hashSync(newPassword, salt);

      user.password = passwordHash;
      await user.save();

      // Delete used OTP
      await Otp.deleteOne({ _id: decoded.otpId });
      res.clearCookie('tokenResetPassword');

      new OK({ message: 'Đặt lại mật khẩu thành công' }).send(res);
    } catch (error) {
      throw new BadRequestError('Token reset không hợp lệ hoặc đã hết hạn');
    }
  }
}

export default new ControllerUsers();