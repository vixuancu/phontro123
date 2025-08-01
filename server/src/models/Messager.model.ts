import mongoose, { Schema, Model } from 'mongoose';
import { IMessage } from '../types/models';

const messageSchema = new Schema<IMessage>(
    {
        senderId: { 
            type: String, 
            required: true, 
            ref: 'user' 
        },
        receiverId: { 
            type: String, 
            required: true, 
            ref: 'user' 
        },
        message: { 
            type: String, 
            required: true 
        },
        status: { 
            type: String, 
            required: true 
        },
        isRead: { 
            type: Boolean, 
            required: true, 
            default: false 
        },
    },
    {
        timestamps: true,
    },
);

// Create indexes for performance
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });
messageSchema.index({ isRead: 1 });

const Message: Model<IMessage> = mongoose.model<IMessage>('messager', messageSchema);

export default Message;