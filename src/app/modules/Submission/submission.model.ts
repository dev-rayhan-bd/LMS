import { model, Schema } from "mongoose";
import { ISubmission } from "./submission.interface";

const submissionSchema = new Schema<ISubmission>({
  task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  answerPdf: { type: String, required: true },
  submissionStatus: { 
    type: String, 
    enum: ['in time', 'late', 'don\'t submit'], 
    default: 'in time' 
  },
  marks: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  feedback: { type: String },
  correctAnswerPdf: { type: String },
  isMarked: { type: Boolean, default: false }
}, { timestamps: true });


submissionSchema.index({ task: 1, student: 1 }, { unique: true });

export const SubmissionModel = model<ISubmission>('Submission', submissionSchema);