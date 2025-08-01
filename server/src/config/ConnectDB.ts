import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Kết nối tới MongoDB database (Connect to MongoDB Database)
 */
const connectDB = async (): Promise<void> => {
  try {
    // Kết nối MongoDB với connection string từ environment variables
    const conn = await mongoose.connect(process.env.CONNECT_DB as string, {
      // Các options tối ưu cho MongoDB connection
      maxPoolSize: 10, // Số lượng connection tối đa trong pool
      serverSelectionTimeoutMS: 5000, // Timeout khi chọn server (5 giây)
      socketTimeoutMS: 45000, // Timeout cho socket connection (45 giây)
      retryWrites: true, // Tự động retry khi write operation fail
    });

    console.log(`MongoDB kết nối thành công: ${conn.connection.host}`);
  } catch (error) {
    console.error("Lỗi kết nối MongoDB:", error);
    process.exit(1); // Thoát ứng dụng nếu không kết nối được database
  }
};

export default connectDB;
