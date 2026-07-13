import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { sendNotificationToCourse, sendPushNotification, notifyParentsOfCourseStudents } from "../../utils/sendNotification";
import { ClassModel } from "../Class/class.model";
import { CourseModel } from "../Course/course.model";
import { TaskModel } from "../Task/task.model";
import { IAnnouncement, IComment } from "./announcement.interface";
import { AnnouncementModel, CommentModel } from "./announcement.model";
import httpStatus from 'http-status';
const createAnnouncementIntoDB = async (payload: IAnnouncement) => {

  const isCourseExist = await CourseModel.findById(payload.courseId);
  if (!isCourseExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Course not found! You cannot create an announcement for a non-existing course.");
  }

  const result = await AnnouncementModel.create(payload);

  // Notify all students in the course
  await sendNotificationToCourse(
    payload.courseId.toString(),
    'New Announcement! 📢',
    `New update from teacher: "${payload.details.substring(0, 40)}..."`,
    'announcement'
  );  // Notify parents of all students in the course
  await notifyParentsOfCourseStudents(
    payload.courseId.toString(),
    'New Announcement for [StudentName] \ud83d\udce2',
    `New announcement for [StudentName]: "${payload.details.substring(0, 40)}..."`,
    'announcement'
  );  return result;
};

const getAnnouncementsByCourseFromDB = async (courseId: string, query: Record<string, unknown>) => {
  // Find announcements by courseId
  const announcementQuery = new QueryBuilder(
    AnnouncementModel.find({ courseId: courseId }),
    query
  ).sort().paginate();

  // Populate creator and nested comments with replies
  announcementQuery.modelQuery.populate([
    { path: 'createdBy', select: 'fullName image role' },
    { 
      path: 'comments', 
      strictPopulate: false, // Fixes the "StrictPopulateError"
      match: { parentCommentId: null }, // Only top-level comments
      populate: [
        { path: 'user', select: 'fullName image role' },
        { 
          path: 'replies', 
          strictPopulate: false, // Allows populating nested replies virtual
          populate: { path: 'user', select: 'fullName image role' } 
        }
      ] 
    }
  ]);

  const result = await announcementQuery.modelQuery;
  const meta = await announcementQuery.countTotal();
  return { meta, result };
};

// const addCommentIntoDB = async (payload: IComment) => {


//       // 1. Validate if the Announcement exists
//   const isAnnouncementExist = await AnnouncementModel.findById(payload.announcementId);
//   if (!isAnnouncementExist) {
//     throw new AppError(httpStatus.NOT_FOUND, "Announcement not found! You cannot comment on a non-existing announcement.");
//   }

//   // 2. If it's a reply, validate if the parent comment exists
//   if (payload.parentCommentId) {
//     const isParentCommentExist = await CommentModel.findById(payload.parentCommentId);
//     if (!isParentCommentExist) {
//       throw new AppError(httpStatus.NOT_FOUND, "The comment you are trying to reply to does not exist.");
//     }
//   }
//   const result = await CommentModel.create(payload);

//   // If this is a reply (teacher/assistant replying to a student)
//   if (payload.parentCommentId) {
//     const parentComment = await CommentModel.findById(payload.parentCommentId);
//     if (parentComment) {
//       await sendPushNotification(
//         parentComment.user.toString(),
//         'New Reply on your comment! 💬',
//         `Teacher replied to your comment in the course announcement.`,
//         'announcement'
//       );
//     }
//   }
//   return await result.populate('user', 'fullName image role');
// };



const addCommentIntoDB = async (payload: IComment) => {
 
  if (payload.announcementId) {
    const isAnnouncementExist = await AnnouncementModel.findById(payload.announcementId);
    if (!isAnnouncementExist) {
      throw new AppError(httpStatus.NOT_FOUND, "Announcement not found!");
    }
  } 
  else if (payload.classId) {
    const isClassExist = await ClassModel.findById(payload.classId);
    if (!isClassExist) {
      throw new AppError(httpStatus.NOT_FOUND, "Class not found!");
    }
  } 
  else if (payload.taskId) {
    const isTaskExist = await TaskModel.findById(payload.taskId);
    if (!isTaskExist) {
      throw new AppError(httpStatus.NOT_FOUND, "Task not found!");
    }
  } 
  else {

    throw new AppError(httpStatus.BAD_REQUEST, "Please provide announcementId, classId, or taskId.");
  }


  if (payload.parentCommentId) {
    const isParentCommentExist = await CommentModel.findById(payload.parentCommentId);
    if (!isParentCommentExist) {
      throw new AppError(httpStatus.NOT_FOUND, "The comment you are trying to reply to does not exist.");
    }
  }


  const result = await CommentModel.create(payload);

 
  if (payload.parentCommentId) {
    const parentComment = await CommentModel.findById(payload.parentCommentId);
    if (parentComment) {
      await sendPushNotification(
        parentComment.user.toString(),
        'New Reply on your comment! 💬',
        `Someone replied to your comment.`,
        'general'
      );
    }
  }

  return await result.populate('user', 'fullName image role');
};

const deleteAnnouncementFromDB = async (id: string) => {
  await CommentModel.deleteMany({ announcementId: id }); // Delete associated comments first
  return await AnnouncementModel.findByIdAndDelete(id);
};

export const AnnouncementServices = {
  createAnnouncementIntoDB,
  getAnnouncementsByCourseFromDB,
  addCommentIntoDB,
  deleteAnnouncementFromDB
};