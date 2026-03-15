/* eslint-disable @typescript-eslint/no-explicit-any */

import AppError from "../../errors/AppError";
import { TEditProfile } from "./user.constant";
import httpStatus from 'http-status';
import { UserModel } from "./user.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { sendPushNotification } from "../../utils/sendNotification";
import { CourseModel } from "../Course/course.model";
import { StudentProgressModel } from "../Report/report.model";
import { AttendanceModel } from "../Attendence/attendence.model";



const updateProfileFromDB = async (id: string, payload: TEditProfile) => {

  const currentUser = await UserModel.findById(id);

  if (!currentUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }


  const firstName = payload.firstName || currentUser.firstName;
  const lastName = payload.lastName || currentUser.lastName;

  if (payload.firstName || payload.lastName) {
    payload.fullName = `${firstName} ${lastName}`;
  }

  const result = await UserModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};
const getMyProfileFromDB = async (id: string) => {
  const result = await UserModel.findById(id).populate({
    path: 'parentId',
    select: 'fullName image contact email', 
  });

  return result; 
};
const getSingleProfileFromDB = async (id: string, ) => {
  const result = await UserModel.findById(id);

  return result;
};


const deletePrifileFromDB = async (id: string) => {
  const event = await UserModel.findByIdAndDelete(id);

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  return event; // return deleted user if neededd
};

const deleteUserFromDB = async (id: string) => {

  const user = await UserModel.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }


  if (user.role === 'student') {

    await CourseModel.updateMany(
      { students: id }, 
      { 
        $pull: { students: id }, 
        $inc: { totalEnrolled: -1 } 
      }
    );

   
    await StudentProgressModel.deleteMany({ student: id });
    
 
    await AttendanceModel.deleteMany({ student: id });
  }


  if (user.role === 'teacher' || user.role === 'assistant') {

    await CourseModel.updateMany({ teacherId: id }, { $set: { teacherId: null } });
    await CourseModel.updateMany({ assistantId: id }, { $set: { assistantId: null } });
  }

  const deletedUser = await UserModel.findByIdAndDelete(id);

  return deletedUser;
};

const getAllUserFromDB = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(UserModel.find(), query);
  queryBuilder.search(["firstName", "lastName", "email", "role"]).filter().sort().paginate();
  const result = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

  return { meta, result };
};
const blockUserFromDB = async (id: string, status: string) => {

  const user = await UserModel.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }


  const result = await UserModel.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  return result;
};

const approveUserFromDB = async (id: string) => {
  const user = await UserModel.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  // Check if already approved
  if (user.status === 'in-progress') {
    throw new AppError(httpStatus.BAD_REQUEST, 'User is already approved!');
  }

  const result = await UserModel.findByIdAndUpdate(
    id,
    { status: 'in-progress' },
    { new: true }
  );

  // Send Push Notification to the Teacher/Assistant
  await sendPushNotification(
    id,
    'Account Approved! 🎉',
    'Your account has been reviewed and approved by the admin. You can now access all features.',
    'general'
  );

  return result;
};

const assignParentToStudentInDB = async (studentId: string, parentId: string) => {
  // 1. Check if Parent exists and has the 'parent' role
  const parent = await UserModel.findOne({ _id: parentId, role: 'parent' });
  if (!parent) {
    throw new AppError(httpStatus.NOT_FOUND, "Valid Parent not found with this ID");
  }

  // 2. Update student document with parentId
  const result = await UserModel.findByIdAndUpdate(
    studentId,
    { parentId: parentId },
    { new: true }
  );
  // Notify Parent
  await sendPushNotification(
    parentId,
    'New Student Linked! 👨‍👩‍👦',
    `${result?.fullName} has added you as their parent in Educology.`,
    'general'
  );
  return result;
};


const getMyChildrenFromDB = async (parentId: string) => {
  const result = await UserModel.find({ 
    parentId: parentId, 
    role: 'student' 
  }).select('firstName lastName fullName image email contact dob gender');

  return result;
};


export const UserServices = {
  updateProfileFromDB,
  getMyProfileFromDB,
  deletePrifileFromDB,
  getAllUserFromDB,getSingleProfileFromDB,deleteUserFromDB,blockUserFromDB,approveUserFromDB,assignParentToStudentInDB,getMyChildrenFromDB

};
