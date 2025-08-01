import { Request, Response } from 'express';
import Post from '../models/post.model';
import User from '../models/users.model';
import Favourite from '../models/favourite.model';

import { OK, Created } from '../core/success.response';
import { BadRequestError } from '../core/error.response';

// Import email utilities (keeping as require for now)
const SendMailApprove = require('../utils/SendMail/SendMailApprove');
const SendMailReject = require('../utils/SendMail/SendMailReject');

// Pricing configuration
const pricePostVip = [
  { date: 3, price: 50000 },
  { date: 7, price: 315000 },
  { date: 30, price: 1200000 },
];

const pricePostNormal = [
  { date: 3, price: 10000 },
  { date: 7, price: 60000 },
  { date: 30, price: 1000000 },
];

interface CreatePostRequest {
  title: string;
  description: string;
  price: number;
  images: string[];
  category: 'phong-tro' | 'nha-nguyen-can' | 'can-ho-chung-cu' | 'can-ho-mini';
  area: number;
  username: string;
  phone: string;
  options: any;
  location: string;
  endDate: string;
  typeNews: 'vip' | 'normal';
  dateEnd: number;
}

interface GetPostsQuery {
  page?: string;
  limit?: string;
  category?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  status?: 'active' | 'inactive';
}

class ControllerPosts {
  async createPost(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new BadRequestError('Không tìm thấy thông tin người dùng');
    }

    const {
      title,
      description,
      price,
      images,
      category,
      area,
      username,
      phone,
      options,
      location,
      endDate,
      typeNews,
      dateEnd,
    }: CreatePostRequest = req.body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !price ||
      !images ||
      !category ||
      !area ||
      !username ||
      !phone ||
      !options ||
      !location ||
      !endDate ||
      !typeNews ||
      !dateEnd
    ) {
      throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }

    // Validate images array
    if (!Array.isArray(images) || images.length === 0) {
      throw new BadRequestError('Vui lòng upload ít nhất 1 hình ảnh');
    }

    // Calculate end date
    const calculatedEndDate = new Date();
    calculatedEndDate.setDate(calculatedEndDate.getDate() + dateEnd);

    const newPost = await Post.create({
      title,
      description,
      price,
      images,
      category,
      area,
      username,
      phone,
      options,
      location,
      endDate: calculatedEndDate,
      typeNews,
      status: 'active',
      userId: req.user.id,
    });

    new Created({
      message: 'Tạo bài đăng thành công',
      metadata: { post: newPost }
    }).send(res);
  }

  async getPosts(req: Request, res: Response): Promise<void> {
    const {
      page = '1',
      limit = '10',
      category,
      location,
      minPrice,
      maxPrice,
      status = 'active'
    }: GetPostsQuery = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { status };

    if (category) {
      query.category = category;
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    // Get posts with pagination
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Post.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    new OK({
      message: 'Lấy danh sách bài đăng thành công',
      metadata: {
        posts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    }).send(res);
  }

  async getPostById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id) {
      throw new BadRequestError('Thiếu ID bài đăng');
    }

    const post = await Post.findById(id);

    if (!post) {
      throw new BadRequestError('Không tìm thấy bài đăng');
    }

    new OK({
      message: 'Lấy thông tin bài đăng thành công',
      metadata: { post }
    }).send(res);
  }

  async updatePost(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new BadRequestError('Không tìm thấy thông tin người dùng');
    }

    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      throw new BadRequestError('Thiếu ID bài đăng');
    }

    // Find post and check ownership
    const post = await Post.findById(id);
    if (!post) {
      throw new BadRequestError('Không tìm thấy bài đăng');
    }

    if (post.userId !== req.user.id) {
      throw new BadRequestError('Bạn không có quyền chỉnh sửa bài đăng này');
    }

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    new OK({
      message: 'Cập nhật bài đăng thành công',
      metadata: { post: updatedPost }
    }).send(res);
  }

  async deletePost(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new BadRequestError('Không tìm thấy thông tin người dùng');
    }

    const { id } = req.params;

    if (!id) {
      throw new BadRequestError('Thiếu ID bài đăng');
    }

    // Find post and check ownership
    const post = await Post.findById(id);
    if (!post) {
      throw new BadRequestError('Không tìm thấy bài đăng');
    }

    if (post.userId !== req.user.id) {
      throw new BadRequestError('Bạn không có quyền xóa bài đăng này');
    }

    await Post.findByIdAndDelete(id);

    new OK({
      message: 'Xóa bài đăng thành công'
    }).send(res);
  }

  async getMyPosts(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new BadRequestError('Không tìm thấy thông tin người dùng');
    }

    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const posts = await Post.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Post.countDocuments({ userId: req.user.id });
    const totalPages = Math.ceil(total / limitNum);

    new OK({
      message: 'Lấy danh sách bài đăng của tôi thành công',
      metadata: {
        posts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    }).send(res);
  }

  async getPricing(req: Request, res: Response): Promise<void> {
    new OK({
      message: 'Lấy bảng giá thành công',
      metadata: {
        vip: pricePostVip,
        normal: pricePostNormal
      }
    }).send(res);
  }
}

export default new ControllerPosts();