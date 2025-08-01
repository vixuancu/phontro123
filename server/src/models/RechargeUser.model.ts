import mongoose, { Schema, Model } from 'mongoose';
import { IRechargeUser } from '../types/models';

const rechargeUserSchema = new Schema<IRechargeUser>(
    {
        userId: { 
            type: String, 
            required: true, 
            ref: 'user' 
        },
        amount: { 
            type: Number, 
            required: true 
        },
        typePayment: { 
            type: String, 
            required: true 
        },
        status: { 
            type: String, 
            required: true 
        },
    },
    {
        timestamps: true,
    },
);

// Create indexes for performance
rechargeUserSchema.index({ userId: 1 });
rechargeUserSchema.index({ status: 1 });
rechargeUserSchema.index({ typePayment: 1 });

const RechargeUser: Model<IRechargeUser> = mongoose.model<IRechargeUser>('rechargeuser', rechargeUserSchema);

export default RechargeUser;