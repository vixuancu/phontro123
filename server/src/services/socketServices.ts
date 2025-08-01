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
            // Save user info to map when connection is successful
            usersMap.set(dataDecode.id.toString(), socket);
            console.log(`User connected: ${dataDecode.id}`);

            // Handle user disconnect
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

  // Utility method to get connected socket by user ID
  getUserSocket(userId: string): Socket | undefined {
    return usersMap.get(userId);
  }

  // Utility method to check if user is online
  isUserOnline(userId: string): boolean {
    return usersMap.has(userId);
  }

  // Utility method to get all connected users
  getConnectedUsers(): string[] {
    return Array.from(usersMap.keys());
  }

  // Utility method to send message to specific user
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