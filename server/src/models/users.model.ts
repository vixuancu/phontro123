import mongoose, { Schema, Model } from 'mongoose';
import { IUser } from '../types/models';

const userSchema = new Schema<IUser>(
    {
        fullName: { 
            type: String, 
            required: true 
        },
        email: { 
            type: String, 
            required: true,
            unique: true
        },
        password: { 
            type: String, 
            required: true 
        },
        address: { 
            type: String, 
            required: true 
        },
        avatar: { 
            type: String, 
            required: true 
        },
        phone: { 
            type: String, 
            required: true 
        },
        isAdmin: { 
            type: Boolean, 
            default: false 
        },
        isActive: { 
            type: Boolean, 
            default: false 
        },
        balance: { 
            type: Number, 
            default: 0 
        },
        typeLogin: { 
            type: String, 
            enum: ['email', 'google'],
            required: true
        },
    },
    {
        timestamps: true,
    },
);

// Create indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });

const User: Model<IUser> = mongoose.model<IUser>('user', userSchema);

export default User;