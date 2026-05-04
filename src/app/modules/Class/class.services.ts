import mongoose from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import { sendNotificationToCourse } from "../../utils/sendNotification";
import { CommentModel } from "../Announcement/announcement.model";
import { ZoomServices } from "../Zoom/zoom.services";
import { IClass } from "./class.interface";
import { ClassModel } from "./class.model";

// const createClassIntoDB = async (payload: IClass) => {
//   const result = await ClassModel.create(payload);

//   // Notify all students in the course
//   await sendNotificationToCourse(
//     payload.course.toString(),
//     'New Class Scheduled! 📚',
//     `Class "${payload.title}" is scheduled on ${payload.date} at ${payload.time}.`,
//     'class'
//   );

//   return result;
// };
const createClassIntoDB = async (payload: Partial<IClass>, userId: string) => {

  if ((payload as any).isZoomMeeting) {

  
    const zoomData = await ZoomServices.createZoomMeeting(
      userId, 
      payload.title as string, 
      payload.date as any 
    );


    payload.link = zoomData.join_url;
    payload.zoomMeetingId = zoomData.id;
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
  }

  return result;
};


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

















