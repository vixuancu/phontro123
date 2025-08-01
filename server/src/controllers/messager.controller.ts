import { Request, Response } from 'express';
import { BadRequestError } from '../core/error.response';
import Messager from '../models/Messager.model';
import User from '../models/users.model';

import { Created, OK } from '../core/success.response';

interface UserMap {
  [key: string]: {
    id: string;
    username: string;
    avatar: string;
    status: string;
  };
}

class ControllerMessager {
  async createMessage(req: Request, res: Response): Promise<void> {
    const { id } = req.user;
    const { receiverId, message } = req.body;
    if (!receiverId || !message) {
      throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }

    const newMessage = await Messager.create({
      senderId: id,
      receiverId,
      message,
      isRead: false,
    });
    const socket = (global as any).usersMap.get(receiverId.toString());
    if (socket) {
      socket.emit('new-message', {
        message: newMessage,
      });
    }
    const messages = await Messager.find({
      $or: [
        { senderId: id, receiverId },
        { senderId: receiverId, receiverId: id },
      ],
    });

    if (messages.length <= 1) {
      if (socket) {
        socket.emit('new-user-message', {
          message: newMessage,
        });
      }
      new Created({
        message: 'Tạo tin nhắn thành công',
        metadata: newMessage,
      }).send(res);
      return;
    }
    new Created({
      message: 'Tạo tin nhắn thành công',
      metadata: newMessage,
    }).send(res);
  }

  async getMessages(req: Request, res: Response): Promise<void> {
    const { id } = req.user;
    const { receiverId } = req.query;

    // Lấy tất cả tin nhắn giữa hai người dùng
    const messages = await Messager
      .find({
        $or: [
          { senderId: id, receiverId },
          { senderId: receiverId, receiverId: id },
        ],
      })
      .sort({ createdAt: 1 });

    // Đánh dấu tất cả tin nhắn từ người nhận gửi đến là đã đọc
    await Messager.updateMany({ senderId: receiverId, receiverId: id, isRead: false }, { isRead: true });

    new OK({
      message: 'Lấy tin nhắn thành công',
      metadata: messages,
    }).send(res);
  }

  async markMessageAsRead(req: Request, res: Response): Promise<void> {
    const { id } = req.user;
    const { messageId } = req.body;

    if (!messageId) {
      throw new BadRequestError('Vui lòng cung cấp ID tin nhắn');
    }

    // Cập nhật trạng thái đã đọc cho 1 tin nhắn cụ thể
    const updatedMessage = await Messager.findOneAndUpdate(
      { _id: messageId, receiverId: id, isRead: false },
      { isRead: true },
      { new: true },
    );

    if (!updatedMessage) {
      throw new BadRequestError('Không tìm thấy tin nhắn hoặc tin nhắn đã được đọc');
    }

    new OK({
      message: 'Đánh dấu tin nhắn đã đọc thành công',
      metadata: updatedMessage,
    }).send(res);
  }

  async markAllMessagesAsRead(req: Request, res: Response): Promise<void> {
    const { id } = req.user;
    const { senderId } = req.body;

    if (!senderId) {
      throw new BadRequestError('Vui lòng cung cấp ID người gửi');
    }

    // Đánh dấu tất cả tin nhắn từ một người gửi cụ thể là đã đọc
    const result = await Messager.updateMany({ senderId, receiverId: id, isRead: false }, { isRead: true });

    // Thông báo cho người gửi biết tin nhắn đã được đọc
    const socket = (global as any).usersMap.get(senderId.toString());
    if (socket) {
      socket.emit('messages-read', {
        readerId: id,
        count: result.modifiedCount,
      });
    }

    new OK({
      message: 'Đánh dấu tất cả tin nhắn đã đọc thành công',
      metadata: { updatedCount: result.modifiedCount },
    }).send(res);
  }

  async getMessagesByUserId(req: Request, res: Response): Promise<void> {
    const { id } = req.user;

    // Get all messages where the current user is the receiver
    const messages = await Messager.find({
      $or: [{ senderId: id }, { receiverId: id }],
    });

    // Tạo danh sách các ID người dùng duy nhất mà người dùng hiện tại đã tương tác
    const uniqueUserIds = [
      ...new Set([
        ...messages.filter((msg) => msg.senderId !== id).map((msg) => msg.senderId),
        ...messages.filter((msg) => msg.receiverId !== id).map((msg) => msg.receiverId),
      ]),
    ];

    // Get user information for each unique user
    const users = await User.find({ _id: { $in: uniqueUserIds } });

    // Create a map of userId to user info for easy lookup
    const userMap: UserMap = {};
    users.forEach((user) => {
      const userId = user._id.toString();
      let statusUser = 'Đang offline';

      // Kiểm tra xem người dùng có đang online không
      if ((global as any).usersMap.get(userId)) {
        statusUser = 'Đang hoạt động';
      }

      userMap[userId] = {
        id: user._id,
        username: user.fullName,
        avatar: user.avatar,
        status: statusUser,
      };
    });

    // Count unread messages per user
    const unreadCounts: { [key: string]: number } = {};
    messages.forEach((msg) => {
      if (msg.receiverId.toString() === id && !msg.isRead) {
        const senderId = msg.senderId.toString();
        if (!unreadCounts[senderId]) {
          unreadCounts[senderId] = 0;
        }
        unreadCounts[senderId]++;
      }
    });

    // Create the final response with sender info, unread counts and last message
    const result = uniqueUserIds
      .map((userId) => {
        const userIdStr = userId.toString();

        // Find the most recent message between users
        const userMessages = messages.filter(
          (msg) =>
            (msg.senderId.toString() === userIdStr && msg.receiverId.toString() === id) ||
            (msg.senderId.toString() === id && msg.receiverId.toString() === userIdStr),
        );

        const lastMessage =
          userMessages.length > 0
            ? userMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
            : null;

        return {
          sender: userMap[userIdStr] || { id: userIdStr },
          unreadCount: unreadCounts[userIdStr] || 0,
          lastMessage,
        };
      })
      .filter((item) => item.lastMessage !== null);

    new OK({
      message: 'Lấy tin nhắn thành công',
      metadata: result,
    }).send(res);
  }
}

export default new ControllerMessager();