import { Types } from "mongoose";

export type TAttendanceStatus = 'absent' | 'late' | 'on time';

export interface IAttendance {
  course: Types.ObjectId;
   class: Types.ObjectId;
  student: Types.ObjectId;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (optional)
  status: TAttendanceStatus;
  markedBy: Types.ObjectId;
}