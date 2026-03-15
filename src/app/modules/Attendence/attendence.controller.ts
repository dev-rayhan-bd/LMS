import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AttendanceServices } from "./attendence.services";

const markAttendance = catchAsync(async (req, res) => {

  const attendanceData = req.body.attendances 
    ? req.body.attendances 
    : [req.body];

  const payload = attendanceData.map((item: any) => ({
    ...item,
    markedBy: req.user.userId
  }));

  const result = await AttendanceServices.markAttendanceInDB(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attendance recorded successfully',
    data: result
  });
});

const getAllAttendance = catchAsync(async (req, res) => {
  const result = await AttendanceServices.getAllAttendanceFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attendance records retrieved',
    data: result
  });
});

const getMyAttendance = catchAsync(async (req, res) => {
  const result = await AttendanceServices.getStudentAttendanceFromDB(
    req.user.userId,
    req.query
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Your attendance records retrieved',
    data: result
  });
});

const getOverallStats = catchAsync(async (req, res) => {
  const { courseId,studentId} = req.params;
  const result = await AttendanceServices.getAttendanceStatsFromDB(courseId as string,studentId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course attendance statistics retrieved',
    data: result
  });
});
const getMyStats = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const result = await AttendanceServices.getAttendanceStatsFromDB(courseId as string, req.user.userId as string);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Your performance statistics retrieved',
    data: result
  });
});



// const getCourseAttendanceList = catchAsync(async (req, res) => {
//   const { courseId } = req.params;
//   const { date } = req.query; // date format: YYYY-MM-DD

//   const result = await AttendanceServices.getCourseAttendanceListFromDB(
//     courseId as string,
//     date as string || new Date().toISOString().split('T')[0] 
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Attendance list retrieved successfully',
//     data: result
//   });
// });


const getCourseAttendanceList = catchAsync(async (req, res) => {

  const { classId } = req.params; 

  const result = await AttendanceServices.getCourseAttendanceListFromDB(
    classId as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class attendance list retrieved successfully',
    data: result
  });
});

const getClassAttendanceList = catchAsync(async (req, res) => {
  const { classId } = req.params; 

  const result = await AttendanceServices.getClassAttendanceListFromDB(classId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class student list with attendance status retrieved successfully',
    data: result,
  });
});



export const AttendanceControllers = {
  markAttendance,
  getAllAttendance,
  getMyAttendance,
  getOverallStats,
  getMyStats,getCourseAttendanceList,getClassAttendanceList
};