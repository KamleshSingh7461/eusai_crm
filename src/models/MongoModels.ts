import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
    projectId: string;
    userId: string;
    action: string;
    metadata?: any;
    timestamp: Date;
}

const ActivitySchema: Schema = new Schema({
    projectId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    action: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
});

export const Activity = mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);

export interface IComment extends Document {
    projectId: string;
    taskId?: string;
    userId: string;
    text: string;
    attachments?: string[];
    timestamp: Date;
}

const CommentSchema: Schema = new Schema({
    projectId: { type: String, required: true, index: true },
    taskId: { type: String },
    userId: { type: String, required: true },
    text: { type: String, required: true },
    attachments: [{ type: String }],
    timestamp: { type: Date, default: Date.now },
});

export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
