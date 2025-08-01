import { Request, Response } from 'express';
import Post from '../models/post.model';
import User from '../models/users.model';
import Favourite from '../models/favourite.model';

import { OK, Created } from '../core/success.response';
import { BadRequestError } from '../core/error.response';

// Import email utilities (keeping as require for now until we convert them)
const SendMailApprove = require('../utils/SendMail/SendMailApprove');
const SendMailReject = require('../utils/SendMail/SendMailReject');

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

class ControllerPosts {
  async createPost(req: Request, res: Response): Promise<void> {
    const { id } = req.user;
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
    } = req.body;
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

    const findUser = await User.findById(id);

    if (!findUser) {
      throw new BadRequestError('Người dùng không tồn tại');
    }

    let pricePost = 0;
    let postPrice = [];

    if (typeNews === 'vip') {
      postPrice = pricePostVip.find((item) => item.date === Number(dateEnd));
    } else {
      postPrice = pricePostNormal.find((item) => item.date === Number(dateEnd));
    }

    if (postPrice) {
      pricePost = postPrice.price;
    }

    if (findUser.balance < pricePost) {
      throw new BadRequestError('Tài khoản không đủ để đăng tin');
    }

    // Tính toán thời gian hết hạn
    const createdAt = new Date();
    const expiresAt = new Date(createdAt);
    expiresAt.setDate(expiresAt.getDate() + Number(dateEnd));

    const dataPost = await Post.create({
      userId: id,
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
      endDate: expiresAt,
      typeNews,
      isApproved: false,
    });

    findUser.balance -= pricePost;
    await findUser.save();

    new Created({ message: 'Tạo bài đăng thành công', metadata: dataPost }).send(res);
  }

  async getPosts(req: Request, res: Response): Promise<void> {
    const { 
      location, 
      category, 
      area, 
      priceFrom, 
      priceTo, 
      searchType, 
      page = '1', 
      limit = '10' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Tạo query filter
    const filter: any = {
      isApproved: true,
      endDate: { $gte: new Date() }, // Chỉ lấy các post chưa hết hạn
    };

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    if (area) {
      filter.area = area;
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

    if (searchType) {
      filter.typeNews = searchType;
    }

    // Lấy tổng số bài đăng
    const totalPosts = await Post.countDocuments(filter);

    // Lấy dữ liệu post với phân trang
    const dataPost = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Thêm thông tin user cho mỗi post
    const dataPostWithUser = await Promise.all(
      dataPost.map(async (item) => {
        const user = await User.findById(item.userId);
        return {
          ...item.toObject(),
          userInfo: user ? { fullName: user.fullName, avatar: user.avatar } : null,
        };
      })
    );

    new OK({
      message: 'Lấy danh sách bài đăng thành công',
      metadata: {
        posts: dataPostWithUser,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalPosts / limitNum),
          totalPosts,
          hasNextPage: pageNum < Math.ceil(totalPosts / limitNum),
          hasPrevPage: pageNum > 1,
        },
      },
    }).send(res);
  }

  async getPostById(req: Request, res: Response): Promise<void> {
    const { id } = req.query;
    if (!id) {
      throw new BadRequestError('Vui lòng cung cấp ID bài đăng');
    }

    const dataPost = await Post.findById(id);
    if (!dataPost) {
      throw new BadRequestError('Bài đăng không tồn tại');
    }

    // Kiểm tra xem bài đăng có được duyệt không hoặc có phải là của user hiện tại không
    if (!dataPost.isApproved && (!req.user || dataPost.userId.toString() !== req.user.id)) {
      throw new BadRequestError('Bài đăng chưa được duyệt');
    }

    // Lấy thông tin user
    const user = await User.findById(dataPost.userId);
    
    // Kiểm tra favourite nếu user đã đăng nhập
    let isFavourite = false;
    if (req.user) {
      const favourite = await Favourite.findOne({
        userId: req.user.id,
        postId: id,
      });
      isFavourite = !!favourite;
    }

    const result = {
      ...dataPost.toObject(),
      userInfo: user ? { 
        fullName: user.fullName, 
        avatar: user.avatar,
        phone: user.phone 
      } : null,
      isFavourite,
    };

    new OK({
      message: 'Lấy bài đăng thành công',
      metadata: result,
    }).send(res);
  }

  async getPostByUserId(req: Request, res: Response): Promise<void> {
    const { id } = req.user;
    const dataPost = await Post.find({ userId: id }).sort({ createdAt: -1 });
    new OK({ message: 'Lấy danh sách bài đăng thành công', metadata: dataPost }).send(res);
  }

  async getNewPost(req: Request, res: Response): Promise<void> {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string);

    const dataPost = await Post.find({ 
      isApproved: true,
      endDate: { $gte: new Date() } 
    })
      .sort({ createdAt: -1 })
      .limit(limitNum);

    const dataPostWithUser = await Promise.all(
      dataPost.map(async (item) => {
        const user = await User.findById(item.userId);
        return {
          ...item.toObject(),
          userInfo: user ? { fullName: user.fullName, avatar: user.avatar } : null,
        };
      })
    );

    new OK({
      message: 'Lấy danh sách bài đăng mới thành công',
      metadata: dataPostWithUser,
    }).send(res);
  }

  async getPostVip(req: Request, res: Response): Promise<void> {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string);

    const dataPost = await Post.find({ 
      typeNews: 'vip', 
      isApproved: true,
      endDate: { $gte: new Date() } 
    })
      .sort({ createdAt: -1 })
      .limit(limitNum);

    new OK({ message: 'Lấy danh sách bài đăng VIP thành công', metadata: dataPost }).send(res);
  }

  async deletePost(req: Request, res: Response): Promise<void> {
    const { id } = req.user;
    const { postId } = req.body;

    if (!postId) {
      throw new BadRequestError('Vui lòng cung cấp ID bài đăng');
    }

    const findPost = await Post.findOne({ _id: postId, userId: id });
    if (!findPost) {
      throw new BadRequestError('Bài đăng không tồn tại hoặc bạn không có quyền xóa');
    }

    await Post.deleteOne({ _id: postId });
    new OK({ message: 'Xóa bài đăng thành công' }).send(res);
  }

  async getAllPosts(req: Request, res: Response): Promise<void> {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const totalPosts = await Post.countDocuments();
    const dataPost = await Post.find()
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    new OK({
      message: 'Lấy tất cả bài đăng thành công',
      metadata: {
        posts: dataPost,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalPosts / limitNum),
          totalPosts,
        },
      },
    }).send(res);
  }

  async approvePost(req: Request, res: Response): Promise<void> {
    const { postId } = req.body;
    if (!postId) {
      throw new BadRequestError('Vui lòng cung cấp ID bài đăng');
    }

    const findPost = await Post.findById(postId);
    if (!findPost) {
      throw new BadRequestError('Bài đăng không tồn tại');
    }

    findPost.isApproved = true;
    await findPost.save();

    const findUser = await User.findById(findPost.userId);
    if (findUser) {
      SendMailApprove(findUser.email, findPost.title);
    }

    new OK({ message: 'Duyệt bài đăng thành công' }).send(res);
  }

  async rejectPost(req: Request, res: Response): Promise<void> {
    const { postId, reason } = req.body;
    if (!postId) {
      throw new BadRequestError('Vui lòng cung cấp ID bài đăng');
    }

    const findPost = await Post.findById(postId);
    if (!findPost) {
      throw new BadRequestError('Bài đăng không tồn tại');
    }

    const findUser = await User.findById(findPost.userId);
    if (findUser) {
      // Hoàn tiền khi từ chối bài đăng
      let refundAmount = 0;
      const postPrice = findPost.typeNews === 'vip' ? 
        pricePostVip.find(p => p.date === 3)?.price || 0 : 
        pricePostNormal.find(p => p.date === 3)?.price || 0;
      
      findUser.balance += postPrice;
      await findUser.save();

      SendMailReject(findUser.email, findPost.title, reason || 'Không có lý do cụ thể');
    }

    await Post.deleteOne({ _id: postId });
    new OK({ message: 'Từ chối bài đăng thành công' }).send(res);
  }

  async postSuggest(req: Request, res: Response): Promise<void> {
    const { id } = req.user;
    
    // Lấy các bài đăng mà user đã yêu thích
    const userFavourites = await Favourite.find({ userId: id });
    const favouritePostIds = userFavourites.map(fav => fav.postId);

    if (favouritePostIds.length === 0) {
      // Nếu user chưa có yêu thích nào, trả về bài đăng mới nhất
      const newPosts = await Post.find({ 
        isApproved: true,
        endDate: { $gte: new Date() },
        userId: { $ne: id } // Không lấy bài đăng của chính user
      })
        .sort({ createdAt: -1 })
        .limit(10);

      new OK({
        message: 'Lấy gợi ý bài đăng thành công',
        metadata: newPosts,
      }).send(res);
      return;
    }

    // Lấy thông tin các bài đăng yêu thích để phân tích
    const favouritePosts = await Post.find({ _id: { $in: favouritePostIds } });

    // Tạo mapping category và location từ các bài đăng yêu thích
    const preferredCategories = [...new Set(favouritePosts.map(post => post.category))];
    const preferredLocations = [...new Set(favouritePosts.map(post => post.location))];

    // Tìm bài đăng gợi ý dựa trên category và location
    const suggestedPosts = await Post.find({
      isApproved: true,
      endDate: { $gte: new Date() },
      userId: { $ne: id },
      _id: { $nin: favouritePostIds }, // Loại trừ các bài đã yêu thích
      $or: [
        { category: { $in: preferredCategories } },
        { location: { $in: preferredLocations } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10);

    new OK({
      message: 'Lấy gợi ý bài đăng thành công',
      metadata: suggestedPosts,
    }).send(res);
  }
}

export default new ControllerPosts();