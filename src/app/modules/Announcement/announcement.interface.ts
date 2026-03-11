import { Types } from "mongoose";

export interface IAnnouncement {
  courseId: Types.ObjectId;
  details: string;
  document?: string;
  link?: string;
  createdBy: Types.ObjectId;
}

export interface IComment {
  announcementId?: Types.ObjectId;
  user: Types.ObjectId;
  comment: string;
  parentCommentId?: Types.ObjectId; // If this exists, it's a reply
   classId?: Types.ObjectId;       
  taskId?: Types.ObjectId;   
}