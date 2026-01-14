import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    guildId: string;
    userId: string;
    userTag: string;
    action: AuditAction;
    target: string;
    changes: Array<{
        field: string;
        oldValue: unknown;
        newValue: unknown;
    }>;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

export type AuditAction =
    | 'CONFIG_UPDATE'
    | 'FEATURE_TOGGLE'
    | 'COMMAND_TOGGLE'
    | 'PERMISSION_UPDATE'
    | 'MOD_ROLE_ADD'
    | 'MOD_ROLE_REMOVE'
    | 'LOG_CHANNEL_SET'
    | 'WELCOME_UPDATE'
    | 'AUTO_ROLE_UPDATE';

const AuditLogSchema = new Schema<IAuditLog>(
    {
        guildId: {
            type: String,
            required: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
        },
        userTag: {
            type: String,
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                'CONFIG_UPDATE',
                'FEATURE_TOGGLE',
                'COMMAND_TOGGLE',
                'PERMISSION_UPDATE',
                'MOD_ROLE_ADD',
                'MOD_ROLE_REMOVE',
                'LOG_CHANNEL_SET',
                'WELCOME_UPDATE',
                'AUTO_ROLE_UPDATE',
            ],
        },
        target: {
            type: String,
            required: true,
        },
        changes: [
            {
                field: { type: String, required: true },
                oldValue: { type: Schema.Types.Mixed },
                newValue: { type: Schema.Types.Mixed },
            },
        ],
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Index for efficient queries
AuditLogSchema.index({ guildId: 1, createdAt: -1 });
AuditLogSchema.index({ guildId: 1, action: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
