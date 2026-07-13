import { Types } from "mongoose";

export type TSubmissionStatus = 'in time' | 'late' | 'don\'t submit';

export interface ISubmission {
  task: Types.ObjectId;
  student: Types.ObjectId;
  course: Types.ObjectId;
  answerPdf: string;
  submissionStatus: TSubmissionStatus;
  marks?: number;
  totalMarks?: number;
  percentage?: number;
  feedback?: string;
  correctAnswerPdf?: string; 
  isMarked: boolean;
}