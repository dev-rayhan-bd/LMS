import QueryBuilder from "../../builder/QueryBuilder";
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

// const getClassesByCourse = async (courseId: string) => {
//   const classes = await ClassModel.find({ course: courseId })
//     .populate('createdBy', 'fullName image') .populate({
//       path: 'comments',
//       match: { parentCommentId: null },
//       populate: [
//         { path: 'user', select: 'fullName image role' }, 
//         { 
//           path: 'replies', 
//           populate: { path: 'user', select: 'fullName image role' } 
//         }
//       ]
//     })
//     .sort({ date: 1 })
//     .lean();


//   const results = await Promise.all(classes.map(async (cls) => {
//     const comments = await CommentModel.find({ classId: cls._id, parentCommentId: null })
//       .populate('user', 'fullName image role')
//       .populate({
//         path: 'replies',
//         populate: { path: 'user', select: 'fullName image role' }
//       });
    
//     return { ...cls, comments };
//   }));

//   return results;
// };

const getClassesByCourse = async (courseId: string, query: Record<string, unknown>) => {

  const classQuery = new QueryBuilder(
    ClassModel.find({ course: courseId }), 
    query
  )
    .search(['title', 'details']) 
    .filter()
    .sort() 
    .paginate()
    .fields();

 
  classQuery.modelQuery.populate([
    { 
      path: 'createdBy', 
      select: 'fullName image' 
    },
    {
      path: 'comments',
      match: { parentCommentId: null }, 
      populate: [
        { path: 'user', select: 'fullName image role' },
        {
          path: 'replies', 
          populate: { path: 'user', select: 'fullName image role' }
        }
      ]
    }
  ]);


  const result = await classQuery.modelQuery;
  const meta = await classQuery.countTotal();

  return { meta, result };
};

export const ClassServices={createClassIntoDB,getClassesByCourse}

















