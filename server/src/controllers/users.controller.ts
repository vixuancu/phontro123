import { Request, Response } from 'express';
import User from '../models/users.model';
import ApiKey from '../models/apiKey.model';
import RechargeUser from '../models/RechargeUser.model';
import Post from '../models/post.model';
import KeyWordSearch from '../models/keyWordSearch.model';
import Otp from '../models/otp.model';
import { JwtPayload } from '../types/express.d';

import sendMailForgotPassword from '../utils/SendMail/sendMailForgotPassword';
import { BadRequestError } from '../core/error.response';
import { createApiKey, createToken, createRefreshToken, verifyToken } from '../services/tokenSevices';
import { Created, OK } from '../core/success.response';

import bcrypt from 'bcrypt';
import CryptoJS from 'crypto-js';
import jwt from 'jsonwebtoken';
import otpGenerator from 'otp-generator';
import { jwtDecode } from 'jwt-decode';

import { AiSearchKeyword } from '../utils/AISearch/AISearch';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

class ControllerUsers {
  async register(req: Request, res: Response): Promise<void> {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password || !phone) {
      throw new BadRequestError('Vui lòng nhập đày đủ thông tin');
    }
    const user = await User.findOne({ email });
    if (user) {
      throw new BadRequestError('Người dùng đã tồn tại');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
      balance: 0,
      role: 'user',
    });

    // Create API key for user
    const apiKeyData = await createApiKey(String(newUser._id));
    await ApiKey.create(apiKeyData);

    // Generate tokens
    const tokens = await createToken({ id: String(newUser._id), email: newUser.email });
    const refreshToken = await createRefreshToken({ id: String(newUser._id), email: newUser.email });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    new Created({
      message: 'Đăng ký thành công',
      metadata: {
        user: {
          id: String(newUser._id),
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phone,
          balance: newUser.balance,
          role: newUser.role,
        },
        accessToken: tokens,
      },
    }).send(res);
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError('Vui lòng nhập email và mật khẩu');
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new BadRequestError('Email hoặc mật khẩu không đúng');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError('Email hoặc mật khẩu không đúng');
    }

    // Generate tokens
    const tokens = await createToken({ id: String(user._id), email: user.email });
    const refreshToken = await createRefreshToken({ id: String(user._id), email: user.email });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    new OK({
      message: 'Đăng nhập thành công',
      metadata: {
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          balance: user.balance,
          role: user.role,
          avatar: user.avatar,
        },
        accessToken: tokens,
      },
    }).send(res);
  }

  async loginGoogle(req: Request, res: Response): Promise<void> {
    const { email, fullName, avatar } = req.body;

    if (!email || !fullName) {
      throw new BadRequestError('Thông tin Google không đầy đủ');
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      const defaultPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      user = await User.create({
        fullName,
        email,
        password: hashedPassword,
        phone: '',
        balance: 0,
        role: 'user',
        avatar: avatar || '',
      });

      // Create API key for new user
      const apiKeyData = await createApiKey(String(user._id));
      await ApiKey.create(apiKeyData);
    }

    // Generate tokens
    const tokens = await createToken({ id: String(user._id), email: user.email });
    const refreshToken = await createRefreshToken({ id: String(user._id), email: user.email });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    new OK({
      message: 'Đăng nhập Google thành công',
      metadata: {
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          balance: user.balance,
          role: user.role,
          avatar: user.avatar,
        },
        accessToken: tokens,
      },
    }).send(res);
  }

  async authUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.user;
    const user = await User.findById(id);
    
    if (!user) {
      throw new BadRequestError('Người dùng không tồn tại');
    }

    new OK({
      message: 'Xác thực thành công',
      metadata: {
        id: String(user._id),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        role: user.role,
        avatar: user.avatar,
      },
    }).send(res);
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.clearCookie('refreshToken');
    new OK({ message: 'Đăng xuất thành công' }).send(res);
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw new BadRequestError('Refresh token không tồn tại');
    }

    try {
      const decoded = await verifyToken(refreshToken);
      const user = await User.findById(decoded.id);

      if (!user) {
        throw new BadRequestError('Người dùng không tồn tại');
      }

      // Generate new access token
      const newAccessToken = await createToken({ id: String(user._id), email: user.email });

      new OK({
        message: 'Làm mới token thành công',
        metadata: { accessToken: newAccessToken },
      }).send(res);
    } catch (error) {
      throw new BadRequestError('Refresh token không hợp lệ');
    }
  }

  async getAdminStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Tổng số người dùng
      const totalUsers = await User.countDocuments();
      
      // Tổng số bài đăng
      const totalPosts = await Post.countDocuments();
      
      // Tổng số bài đăng chờ duyệt
      const pendingPosts = await Post.countDocuments({ isApproved: false });
      
      // Tổng số bài đăng đã duyệt
      const approvedPosts = await Post.countDocuments({ isApproved: true });
      
      // Tổng doanh thu từ nạp tiền
      const totalRevenue = await RechargeUser.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      // Số người dùng mới trong tháng
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const newUsersThisMonth = await User.countDocuments({
        createdAt: { $gte: startOfMonth }
      });
      
      // Top 5 người dùng có số dư cao nhất
      const topUsers = await User.find()
        .sort({ balance: -1 })
        .limit(5)
        .select('fullName email balance');

      // Thống kê theo ngày trong 7 ngày gần đây
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const usersCount = await User.countDocuments({
          createdAt: { $gte: date, $lt: nextDate }
        });
        
        const postsCount = await Post.countDocuments({
          createdAt: { $gte: date, $lt: nextDate }
        });
        
        last7Days.push({
          date: date.toISOString().split('T')[0],
          users: usersCount,
          posts: postsCount
        });
      }

      new OK({
        message: 'Lấy thống kê admin thành công',
        metadata: {
          totalUsers,
          totalPosts,
          pendingPosts,
          approvedPosts,
          totalRevenue: totalRevenue[0]?.total || 0,
          newUsersThisMonth,
          topUsers,
          last7Days
        },
      }).send(res);
    } catch (error) {
      throw new BadRequestError('Lỗi khi lấy thống kê');
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.user;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }

    const user = await User.findById(id);
    if (!user) {
      throw new BadRequestError('Người dùng không tồn tại');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestError('Mật khẩu cũ không đúng');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    new OK({ message: 'Đổi mật khẩu thành công' }).send(res);
  }

  async getRechargeUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.user;
    const rechargeHistory = await RechargeUser.find({ userId: id }).sort({ createdAt: -1 });
    new OK({ message: 'Lấy lịch sử nạp tiền thành công', metadata: rechargeHistory }).send(res);
  }

  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.user;
    const updateData = req.body;

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });
    new OK({ message: 'Cập nhật thông tin thành công', metadata: user }).send(res);
  }

  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const dataUser = await User.find().select('-password');
    const enhancedUsers = await Promise.all(
      dataUser.map(async (user) => {
        const postCount = await Post.countDocuments({ userId: user._id });
        return {
          ...user.toObject(),
          postCount
        };
      })
    );
    new OK({ message: 'Lấy danh sách người dùng thành công', metadata: enhancedUsers }).send(res);
  }

  async getRechargeStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Thống kê theo tháng
      const monthlyStats = await RechargeUser.aggregate([
        { $match: { status: 'success' } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);

      // Thống kê theo phương thức thanh toán
      const paymentMethodStats = await RechargeUser.aggregate([
        { $match: { status: 'success' } },
        {
          $group: {
            _id: '$typePayment',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Tổng doanh thu
      const totalRevenue = await RechargeUser.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      // Top 10 người nạp nhiều nhất
      const topRechargers = await RechargeUser.aggregate([
        { $match: { status: 'success' } },
        {
          $group: {
            _id: '$userId',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $project: {
            totalAmount: 1,
            count: 1,
            userInfo: { $arrayElemAt: ['$userInfo', 0] }
          }
        }
      ]);

      new OK({
        message: 'Lấy thống kê nạp tiền thành công',
        metadata: {
          monthlyStats,
          paymentMethodStats,
          totalRevenue: totalRevenue[0]?.total || 0,
          topRechargers
        },
      }).send(res);
    } catch (error) {
      throw new BadRequestError('Lỗi khi lấy thống kê nạp tiền');
    }
  }

  async searchKeyword(req: Request, res: Response): Promise<void> {
    const { keyword, location, area, category, priceFrom, priceTo } = req.query;

    if (!keyword) {
      throw new BadRequestError('Vui lòng nhập từ khóa tìm kiếm');
    }

    // Lưu keyword vào database
    await KeyWordSearch.create({ keyword });

    // Tạo query filter
    const filter: any = {
      isApproved: true,
      endDate: { $gte: new Date() },
      $text: { $search: keyword as string }
    };

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (area) {
      filter.area = area;
    }

    if (category) {
      filter.category = category;
    }

    if (priceFrom || priceTo) {
      filter.price = {};
      if (priceFrom) {
        filter.price.$gte = parseInt(priceFrom as string);
      }
      if (priceTo) {
        filter.price.$lte = parseInt(priceTo as string);
      }
    }

    const posts = await Post.find(filter).sort({ score: { $meta: 'textScore' } });

    new OK({
      message: 'Tìm kiếm thành công',
      metadata: posts,
    }).send(res);
  }

  async addSearchKeyword(req: Request, res: Response): Promise<void> {
    const { keyword } = req.body;

    if (!keyword) {
      throw new BadRequestError('Vui lòng nhập từ khóa');
    }

    await KeyWordSearch.create({ keyword });
    new OK({ message: 'Thêm từ khóa tìm kiếm thành công' }).send(res);
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    
    if (!email) {
      throw new BadRequestError('Vui lòng nhập email');
    }

    const findUser = await User.findOne({ email });
    if (!findUser) {
      throw new BadRequestError('Email không tồn tại trong hệ thống');
    }

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Hash OTP before saving
    const saltRounds = 10;
    const hashedOtp = await bcrypt.hash(otp, saltRounds);

    // Delete existing OTP for this email
    await Otp.deleteMany({ email });

    // Save new OTP
    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send email
    await sendMailForgotPassword(email, otp);

    // Create token for reset password flow
    const resetToken = jwt.sign(
      { email, otp: hashedOtp },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '10m' }
    );

    res.cookie('tokenResetPassword', resetToken, {
      httpOnly: true,
      secure: false,
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    new OK({ message: 'Mã OTP đã được gửi về email của bạn' }).send(res);
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { otp, newPassword } = req.body;
    const { tokenResetPassword } = req.cookies;

    if (!otp || !newPassword) {
      throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }

    if (!tokenResetPassword) {
      throw new BadRequestError('Token reset không tồn tại');
    }

    try {
      const decode = jwt.verify(
        tokenResetPassword,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as any;

      // Find OTP record
      const otpRecord = await Otp.findOne({ email: decode.email });
      if (!otpRecord) {
        throw new BadRequestError('OTP không tồn tại hoặc đã hết hạn');
      }

      // Verify OTP
      const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);
      if (!isOtpValid) {
        throw new BadRequestError('Mã OTP không đúng');
      }

      // Check if OTP has expired
      if (otpRecord.expiresAt < new Date()) {
        await Otp.deleteOne({ email: decode.email });
        throw new BadRequestError('Mã OTP đã hết hạn');
      }

      // Find user and update password
      const findUser = await User.findOne({ email: decode.email });
      if (!findUser) {
        throw new BadRequestError('Người dùng không tồn tại');
      }

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      findUser.password = hashedPassword;
      await findUser.save();

      // Delete OTP after successful password reset
      await Otp.deleteOne({ email: decode.email });
      res.clearCookie('tokenResetPassword');

      new OK({ message: 'Đặt lại mật khẩu thành công' }).send(res);
    } catch (error) {
      throw new BadRequestError('Token reset không hợp lệ hoặc đã hết hạn');
    }
  }

  async getHotSearch(req: Request, res: Response): Promise<void> {
    const hotKeywords = await KeyWordSearch.aggregate([
      {
        $group: {
          _id: '$keyword',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    new OK({
      message: 'Lấy từ khóa hot thành công',
      metadata: hotKeywords,
    }).send(res);
  }
}

export default new ControllerUsers();