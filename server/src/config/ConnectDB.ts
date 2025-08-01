import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(process.env.CONNECT_DB as string, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        } as any);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
    }
};

export default connectDB;