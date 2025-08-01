import { Socket } from 'socket.io';
import cookie from 'cookie';
import { verifyToken } from './tokenSevices';

// Global users map to track connected users
const usersMap = new Map<string, Socket>();

// Make it globally available
declare global {
  var usersMap: Map<string, Socket>;
}
global.usersMap = usersMap;

class SocketServices {
  connection(socket: Socket): void {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || '');
      const token = cookies.token;

      if (!token) {
        socket.disconnect();
        return;
      }

      verifyToken(token)
        .then((dataDecode) => {
          if (dataDecode && dataDecode.id) {
            // lưu thông tin người dùng vào usersMap
            usersMap.set(dataDecode.id.toString(), socket);
            console.log(`User connected: ${dataDecode.id}`);

            // lắng nghe sự kiện disconnect
            socket.on('disconnect', () => {
              console.log(`User disconnected: ${dataDecode.id}`);
              usersMap.delete(dataDecode.id.toString());
            });
          } else {
            socket.disconnect();
          }
        })
        .catch((error) => {
          console.error('Socket authentication error:', error);
          socket.disconnect();
        });
    } catch (error) {
      console.error('Socket connection error:', error);
      socket.disconnect();
      return;
    }
  }

  // phương thức để lấy socket của người dùng theo ID
  getUserSocket(userId: string): Socket | undefined {
    return usersMap.get(userId);
  }

  // phương thức để kiểm tra xem người dùng có đang trực tuyến hay không
  isUserOnline(userId: string): boolean {
    return usersMap.has(userId);
  }

  // phương thức để lấy tất cả người dùng đang kết nối
  getConnectedUsers(): string[] {
    return Array.from(usersMap.keys());
  }

  // phương thức để gửi tin nhắn đến người dùng cụ thể
  sendToUser(userId: string, event: string, data: any): boolean {
    const socket = usersMap.get(userId);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }
}

export default new SocketServices();