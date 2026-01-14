import mongoose, { Schema, Document } from 'mongoose';

export interface IWarning extends Document {
    guildId: string;
    userId: string;
    userTag: string;
    modId: string;
    modTag: string;
    reason: string;
    createdAt: Date;
}

const WarningSchema = new Schema<IWarning>(
    {
        guildId: {
            type: String,
            required: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        userTag: {
            type: String,
            required: true,
        },
        modId: {
            type: String,
            required: true,
        },
        modTag: {
            type: String,
            required: true,
        },
        reason: {
            type: String,
            required: true,
            maxlength: 1000,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Compound index for efficient user warning lookups
WarningSchema.index({ guildId: 1, userId: 1, createdAt: -1 });

export const Warning = mongoose.model<IWarning>('Warning', WarningSchema);
