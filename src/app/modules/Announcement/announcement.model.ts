import { model, Schema } from "mongoose";
import { IAnnouncement, IComment } from "./announcement.interface";

// 1. Announcement Schema
const announcementSchema = new Schema<IAnnouncement>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  details: { type: String, required: true },
  document: { type: String },
  link: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Define Virtual for Comments (Announcements -> Comments)
announcementSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'announcementId' 
});

// 2. Comment Schema
const commentSchema = new Schema<IComment>({
  announcementId: { type: Schema.Types.ObjectId, ref: 'Announcement' },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: String, required: true },
  parentCommentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null } , //id of student comment
    classId: { type: Schema.Types.ObjectId, ref: 'Class', default: null }, 
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', default: null }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Define Virtual for Replies (Comment -> Replies)
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentCommentId'
});

export const AnnouncementModel = model<IAnnouncement>('Announcement', announcementSchema);
export const CommentModel = model<IComment>('Comment', commentSchema);