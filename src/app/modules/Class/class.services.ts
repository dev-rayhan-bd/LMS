import mongoose from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import { sendNotificationToCourse, notifyParentsOfCourseStudents } from "../../utils/sendNotification";
import { CommentModel } from "../Announcement/announcement.model";
import { ZoomServices } from "../Zoom/zoom.services";
import { IClass } from "./class.interface";
import { ClassModel } from "./class.model";
import AppError from "../../errors/AppError";
import  httpStatus  from "http-status";

// const createClassIntoDB = async (payload: Partial<IClass>, userId: string) => {

//   if ((payload as any).isZoomMeeting) {

  
//     const zoomData = await ZoomServices.createZoomMeeting(
//       userId, 
//       payload.title as string, 
//       payload.date as any 
//     );


//     payload.link = zoomData.join_url;
//     payload.zoomMeetingId = zoomData.id;
//      payload.startUrl = zoomData.start_url;
//     payload.zoomStatus = 'scheduled';
//   }


//   payload.createdBy = new mongoose.Types.ObjectId(userId) as any;


//   const result = await ClassModel.create(payload);


//   if (result) {
//     await sendNotificationToCourse(
//       result.course.toString(),
//       'New Class Scheduled! 📚',
//       `Class "${result.title}" is scheduled on ${result.date} at ${result.time}.`,
//       'class'
//     );
//     // Notify parents of all students in the course
//     await notifyParentsOfCourseStudents(
//       result.course.toString(),
//       'New Class Scheduled for [StudentName] 📚',
//       `A new class "${result.title}" has been scheduled for [StudentName].`,
//       'class'
//     );
//   }

//   return result;
// };


// const getClassesByCourse = async (courseId: string, query: Record<string, unknown>) => {

//   const classQuery = new QueryBuilder(
//     ClassModel.find({ course: courseId }), 
//     query
//   )
//     .search(['title', 'details']) 
//     .filter()
//     .sort() 
//     .paginate()
//     .fields();

 
//   classQuery.modelQuery.populate([
//     { 
//       path: 'createdBy', 
//       select: 'fullName image' 
//     },
//     {
//       path: 'comments',
//       match: { parentCommentId: null }, 
//       populate: [
//         { path: 'user', select: 'fullName image role' },
//         {
//           path: 'replies', 
//           populate: { path: 'user', select: 'fullName image role' }
//         }
//       ]
//     }
//   ]);


//   const result = await classQuery.modelQuery;
//   const meta = await classQuery.countTotal();

//   return { meta, result };
// };

const createClassIntoDB = async (payload: Partial<IClass>, userId: string) => {

  if ((payload as any).isZoomMeeting) {

    const rawDate = payload.date; 
    const rawTime = (payload as any).time; 

    if (!rawDate || !rawTime) {
      throw new AppError(httpStatus.BAD_REQUEST, "Date and Time are required for Zoom meeting");
    } 


    const [time, modifier] = rawTime.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    if (hours.length === 1) {
      hours = `0${hours}`;
    }


    const formattedStartTime = `${rawDate}T${hours}:${minutes}:00`;

    const zoomData = await ZoomServices.createZoomMeeting(
      userId, 
      payload.title as string, 
      formattedStartTime 
    );

    payload.link = zoomData.join_url;
    payload.zoomMeetingId = zoomData.id;
    payload.startUrl = zoomData.start_url;
    payload.zoomStatus = 'scheduled';
  }

  payload.createdBy = new mongoose.Types.ObjectId(userId) as any;

  const result = await ClassModel.create(payload);

  if (result) {
    await sendNotificationToCourse(
      result.course.toString(),
      'New Class Scheduled! 📚',
      `Class "${result.title}" is scheduled on ${result.date} at ${result.time}.`,
      'class'
    );
    await notifyParentsOfCourseStudents(
      result.course.toString(),
      'New Class Scheduled for [StudentName] 📚',
      `A new class "${result.title}" has been scheduled for [StudentName].`,
      'class'
    );
  }

  return result;
};
const getClassesByCourse = async (
  courseId: string, 
  query: Record<string, unknown>,
  role: string
) => {

  const classQuery = new QueryBuilder(
    ClassModel.find({ course: courseId }), 
    query
  )
    .search(['title', 'details']) 
    .filter()
    .sort() 
    .paginate()
    .fields();


  if (role === 'student') {
    classQuery.modelQuery.select('-startUrl');
  }

  classQuery.modelQuery.populate([
    { path: 'createdBy', select: 'fullName image' },
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

















