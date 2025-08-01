import mongoose, { Schema, Model } from 'mongoose';
import { IFavourite } from '../types/models';

const favouriteSchema = new Schema<IFavourite>(
    {
        userId: { 
            type: String, 
            required: true, 
            ref: 'user' 
        },
        postId: { 
            type: String, 
            required: true, 
            ref: 'posts' 
        },
    },
    {
        timestamps: true,
    },
);

// Create indexes for performance and uniqueness
favouriteSchema.index({ userId: 1, postId: 1 }, { unique: true });
favouriteSchema.index({ userId: 1 });
favouriteSchema.index({ postId: 1 });

const Favourite: Model<IFavourite> = mongoose.model<IFavourite>('favourite', favouriteSchema);

export default Favourite;