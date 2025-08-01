import mongoose, { Schema, Model } from 'mongoose';
import { IOtp } from '../types/models';

const otpSchema = new Schema<IOtp>(
    {
        email: { 
            type: String, 
            required: true, 
            ref: 'user' 
        },
        otp: { 
            type: String, 
            required: true 
        },
        time: { 
            type: Date, 
            default: Date.now, 
            index: { expires: 300 } // Tự động xóa sau 5 phút 
        },
        type: { 
            type: String, 
            enum: ['forgotPassword', 'verifyAccount'], 
            required: true 
        },
    },
    {
        timestamps: true,
    },
);

// Create indexes for performance
otpSchema.index({ email: 1 });
otpSchema.index({ type: 1 });

const Otp: Model<IOtp> = mongoose.model<IOtp>('otp', otpSchema);

export default Otp;