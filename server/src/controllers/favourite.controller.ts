import { Request, Response } from 'express';
import Favourite from '../models/favourite.model';
import User from '../models/users.model';
import Post from '../models/post.model';
import { JwtPayload } from '../types/express.d';

import { Created, OK } from '../core/success.response';
import { BadRequestError } from '../core/error.response';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

class ControllerFavourite {
  async createFavourite(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.user;
    const { postId } = req.body;
    const findUser = await User.findById(id);
    const findPost = await Post.findById(postId);
    const findFavourite = await Favourite.findOne({ userId: id, postId });

    if (findFavourite) {
      throw new BadRequestError('Bạn đã thêm vào yêu thích');
    }

    const favourite = await Favourite.create({ userId: id, postId });

    if (findPost && findUser) {
      const socket = (global as any).usersMap.get(findPost.userId.toString());
      if (socket) {
        socket.emit('new-favourite', {
          favourite: favourite,
          avatar: findUser.avatar,
          content: `${findUser.fullName} đã thêm tin đăng ${findPost.title} vào yêu thích`,
        });
      }
    }
    new Created({
      message: 'Thêm vào yêu thích thành công',
      metadata: favourite,
    }).send(res);
  }

  async deleteFavourite(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.user;
    const { postId } = req.body;
    const findFavourite = await Favourite.findOne({ userId: id, postId });
    if (!findFavourite) {
      throw new BadRequestError('Bạn chưa thêm vào yêu thích');
    }
    await Favourite.deleteOne({ userId: id, postId });
    new OK({
      message: 'Xóa khỏi yêu thích thành công',
    }).send(res);
  }

  async getFavourite(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.user;
    const findFavourite = await Favourite.find({ userId: id });
    const findPost = await Post.find({ _id: { $in: findFavourite.map((item) => item.postId) } });
    new OK({
      message: 'Lấy danh sách yêu thích thành công',
      metadata: findPost,
    }).send(res);
  }
}

export default new ControllerFavourite();