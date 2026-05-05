import { Schema, model, Types } from 'mongoose';
import { IClass } from './class.interface';



const classSchema = new Schema<IClass>({
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  details: { type: String, required: true },
 documents: [{ type: String }],
  link: { type: String, required: true },

zoomMeetingId: { type: String, default: null },
zoomStatus: { 
    type: String, 
    enum: ['scheduled', 'started', 'ended', 'recorded'], 
    default: 'scheduled' 
},
recordingLink: { type: String, default: null },
startUrl: { type: String, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

classSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'classId'
});


classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });
export const ClassModel = model<IClass>('Class', classSchema);