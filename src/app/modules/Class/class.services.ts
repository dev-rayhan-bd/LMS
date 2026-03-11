import { sendNotificationToCourse } from "../../utils/sendNotification";
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
const getClassesByCourse = async (courseId: string) => await ClassModel.find({ course: courseId }).sort({ date: 1 }).populate({
      path: 'createdBy',
      select: 'fullName image'
    });

export const ClassServices={createClassIntoDB,getClassesByCourse}

















