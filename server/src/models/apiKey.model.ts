import mongoose, { Schema, Model } from 'mongoose';
import { IApiKey } from '../types/models';

const apiKeySchema = new Schema<IApiKey>(
    {
        userId: { 
            type: String, 
            required: true, 
            ref: 'user' 
        },
        publicKey: { 
            type: String, 
            required: true 
        },
        privateKey: { 
            type: String, 
            required: true 
        },
    },
    {
        timestamps: true,
    },
);

// Create indexes for performance
apiKeySchema.index({ userId: 1 });
apiKeySchema.index({ publicKey: 1 });

const ApiKey: Model<IApiKey> = mongoose.model<IApiKey>('apikey', apiKeySchema);

export default ApiKey;