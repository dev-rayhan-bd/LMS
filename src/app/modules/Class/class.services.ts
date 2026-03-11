import { sendNotificationToCourse } from "../../utils/sendNotification";
import { CommentModel } from "../Announcement/announcement.model";
import { IClass } from "./class.interface";
import { ClassModel } from "./class.model";

const createClassIntoDB = async (payload: IClass) => {
  const result = await ClassModel.create(payload);

  // Notify all students in the course
  await sendNotificationToCourse(
    payload.course.toString(),
    'New Class Scheduled! 📚',
    `Class "${payload.title}" is scheduled on ${payload.date} at ${payload.time}.`,
    'class'
  );

  return result;
};
// const getClassesByCourse = async (courseId: string) => await ClassModel.find({ course: courseId }).sort({ date: 1 }).populate({
//       path: 'createdBy',
//       select: 'fullName image'
//     });
const getClassesByCourse = async (courseId: string) => {
  const classes = await ClassModel.find({ course: courseId })
    .populate('createdBy', 'fullName image') .populate({
      path: 'comments',
      match: { parentCommentId: null },
      populate: [
        { path: 'user', select: 'fullName image role' }, 
        { 
          path: 'replies', 
          populate: { path: 'user', select: 'fullName image role' } 
        }
      ]
    })
    .sort({ date: 1 })
    .lean();


  const results = await Promise.all(classes.map(async (cls) => {
    const comments = await CommentModel.find({ classId: cls._id, parentCommentId: null })
      .populate('user', 'fullName image role')
      .populate({
        path: 'replies',
        populate: { path: 'user', select: 'fullName image role' }
      });
    
    return { ...cls, comments };
  }));

  return results;
};
export const ClassServices={createClassIntoDB,getClassesByCourse}

















