import { model, Schema } from "mongoose";
import { ITask } from "./task.interface";

const taskSchema = new Schema<ITask>({
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['homework', 'exam'], required: true },
  startDate: { type: String, required: true },
  startTime: { type: String, required: true },
  endDate: { type: String, required: true },
  endTime: { type: String, required: true },
  details: { type: String, required: true },
 documents: [{ type: String }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for dynamic status
taskSchema.virtual('status').get(function() {
  const now = new Date();

  const endDateTime = new Date(`${this.endDate} ${this.endTime}`);
  
  return now > endDateTime ? 'time over' : 'active';
});

taskSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'taskId'
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

export const TaskModel = model<ITask>('Task', taskSchema);