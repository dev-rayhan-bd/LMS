import { model, Schema } from "mongoose";
import { IAttendance } from "./attendence.interface";


const attendanceSchema = new Schema<IAttendance>({
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    class: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
    time: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['absent', 'late', 'on time'], 
    required: true 
  },
  markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });


attendanceSchema.index({ class: 1, student: 1 }, { unique: true });

export const AttendanceModel = model<IAttendance>('Attendance', attendanceSchema);