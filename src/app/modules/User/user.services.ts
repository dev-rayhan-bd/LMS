/* eslint-disable @typescript-eslint/no-explicit-any */

import AppError from "../../errors/AppError";
import { TEditProfile } from "./user.constant";
import httpStatus from 'http-status';
import { UserModel } from "./user.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { sendPushNotification, notifyParentsOfProfileChange } from "../../utils/sendNotification";
import { CourseModel } from "../Course/course.model";
import { StudentProgressModel } from "../Report/report.model";
import { AttendanceModel } from "../Attendence/attendence.model";



const updateProfileFromDB = async (id: string, payload: TEditProfile) => {

  const currentUser = await UserModel.findById(id);

  if (!currentUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  const changedFields: string[] = [];
  if (payload.firstName && payload.firstName !== currentUser.firstName) changedFields.push('name');
  if (payload.lastName && payload.lastName !== currentUser.lastName) changedFields.push('name');
  if (payload.contact && payload.contact !== currentUser.contact) changedFields.push('contact');
  if (payload.dob && payload.dob !== currentUser.dob?.toString()) changedFields.push('date of birth');
  if (payload.gender && payload.gender !== currentUser.gender) changedFields.push('gender');

  const firstName = payload.firstName || currentUser.firstName;
  const lastName = payload.lastName || currentUser.lastName;

  if (payload.firstName || payload.lastName) {
    payload.fullName = `${firstName} ${lastName}`;
  }

  const result = await UserModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  // If student's profile changed, notify all their parents
  if (currentUser.role === 'student' && changedFields.length > 0 && currentUser.parentIds && currentUser.parentIds.length > 0) {
    await notifyParentsOfProfileChange(id, changedFields);
  }

  return result;
};
const getMyProfileFromDB = async (id: string) => {
  const result = await UserModel.findById(id).populate({
    path: 'parentIds',
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

const assignParentToStudentInDB = async (studentId: string, parentIds: string[]) => {
  // 1. Validate all parent IDs exist and have 'parent' role
  const parents = await UserModel.find({ _id: { $in: parentIds }, role: 'parent' });
  if (parents.length !== parentIds.length) {
    throw new AppError(httpStatus.NOT_FOUND, "One or more valid Parents not found with the provided IDs");
  }

  // 2. Add parent IDs to student (using $addToSet to avoid duplicates)
  const result = await UserModel.findByIdAndUpdate(
    studentId,
    { $addToSet: { parentIds: { $each: parentIds } } },
    { new: true }
  );

  // Notify each Parent
  for (const parent of parents) {
    await sendPushNotification(
      parent._id.toString(),
      'New Student Linked! 👨\u200d👩\u200d👦',
      `${result?.fullName} has added you as their parent in Educology.`,
      'general'
    );
  }

  return result;
};

const removeParentFromStudentInDB = async (studentId: string, parentId: string) => {
  // 1. Check student exists
  const student = await UserModel.findById(studentId);
  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, "Student not found!");
  }

  // 2. Check the parent is actually assigned
  if (!student.parentIds || !student.parentIds.some(id => id.toString() === parentId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "This parent is not assigned to the student.");
  }

  // 3. Remove the parent from parentIds array
  const result = await UserModel.findByIdAndUpdate(
    studentId,
    { $pull: { parentIds: parentId } },
    { new: true }
  );

  // Notify removed Parent
  await sendPushNotification(
    parentId,
    'Student Unlinked 👋',
    `${result?.fullName} has removed you as a parent in Educology.`,
    'general'
  );

  return result;
};

const getMyChildrenFromDB = async (parentId: string) => {
  const result = await UserModel.find({ 
    parentIds: { $in: [parentId] }, 
    role: 'student' 
  }).select('firstName lastName fullName image email contact dob gender');

  return result;
};


export const UserServices = {
  updateProfileFromDB,
  getMyProfileFromDB,
  deletePrifileFromDB,
  getAllUserFromDB,getSingleProfileFromDB,deleteUserFromDB,blockUserFromDB,approveUserFromDB,assignParentToStudentInDB,removeParentFromStudentInDB,getMyChildrenFromDB

};
