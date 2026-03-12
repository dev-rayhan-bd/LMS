import { Types } from "mongoose";

export type TTaskType = 'homework' | 'exam';

export interface ITask {
  course: Types.ObjectId;
  title: string;
  type: TTaskType;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string;   // YYYY-MM-DD
  endTime: string;   // HH:mm
  details: string;
documents?: string[];
  createdBy: Types.ObjectId;
   status?: 'active' | 'time over';
     createdAt?: Date; 
  updatedAt?: Date;
}