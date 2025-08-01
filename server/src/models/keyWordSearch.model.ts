import mongoose, { Schema, Model } from 'mongoose';
import { IKeywordSearch } from '../types/models';

const keywordSearchSchema = new Schema<IKeywordSearch>(
    {
        title: { 
            type: String, 
            required: true 
        },
        count: { 
            type: Number, 
            required: true, 
            default: 0 
        },
    },
    {
        timestamps: true,
    },
);

// Create indexes for performance
keywordSearchSchema.index({ title: 1 });
keywordSearchSchema.index({ count: -1 }); // Descending for most popular searches

const KeywordSearch: Model<IKeywordSearch> = mongoose.model<IKeywordSearch>('keyWordSearch', keywordSearchSchema);

export default KeywordSearch;