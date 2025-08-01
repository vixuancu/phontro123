import mongoose, { Schema, Model } from 'mongoose';
import { IPost } from '../types/models';

const postSchema = new Schema<IPost>(
    {
        title: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        images: {
            type: [String],
            required: true,
        },
        userId: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ['phong-tro', 'nha-nguyen-can', 'can-ho-chung-cu', 'can-ho-mini'],
        },
        location: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        area: {
            type: Number,
            required: true,
        },
        options: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['active', 'inactive'],
            default: 'active'
        },
        typeNews: {
            type: String,
            required: true,
            enum: ['vip', 'normal'],
            default: 'normal'
        },
        endDate: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

// Create indexes for performance
postSchema.index({ userId: 1 });
postSchema.index({ category: 1 });
postSchema.index({ status: 1 });
postSchema.index({ location: 1 });
postSchema.index({ price: 1 });
postSchema.index({ endDate: 1 });

const Post: Model<IPost> = mongoose.model<IPost>('posts', postSchema);

export default Post;