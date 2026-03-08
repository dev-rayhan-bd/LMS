import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ReportServices } from "./report.services";
import { UserModel } from "../User/user.model";
import AppError from "../../errors/AppError";


const getMyReport = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const result = await ReportServices.syncAndGetStudentProgress(courseId as string, req.user.userId as string);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Report calculated and retrieved successfully',
    data: result
  });
});

const getCourseOverview = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const result = await ReportServices.getCourseDashboardOverview(courseId as string);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course dashboard counts retrieved',
    data: result
  });
});

const getCourseStudentsStatus = catchAsync(async (req, res) => {
    const { courseId } = req.params;
    const result = await ReportServices.getStudentListWithStatus(courseId as string);
    
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Student status list retrieved',
        data: result
    });
});

const getOverallAcademicStats = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const result = await ReportServices.getOverallCourseAcademicStats(courseId as string);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Overall course academic statistics retrieved successfully',
    data: result
  });
});

const getTabularReport = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { search } = req.query; // Supports the search bar in your UI
  
  const result = await ReportServices.getDetailedTabularReport(courseId as string, search as string);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Detailed tabular report retrieved successfully',
    data: result
  });
});


// Parent Home: Get all enrolled courses of a child
const getChildEnrolledCourses = catchAsync(async (req, res) => {
  const { childId } = req.params;
  const parentId = req.user.userId; // Logged in parent's ID from token

  const result = await ReportServices.getChildEnrolledCoursesFromDB(
    parentId,
    childId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Child's enrolled courses retrieved successfully",
    data: result,
  });
});




// For Teachers and Assistants to view any student's progress
const getStudentProgressForInstructors = catchAsync(async (req, res) => {
  const { courseId, studentId } = req.params;
  const result = await ReportServices.getDetailedStudentProgress(courseId as string, studentId as string );
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Detailed student progress retrieved',
    data: result
  });
});

// Updated Parent Controller (Uses the same detailed logic)
const getChildCourseProgress = catchAsync(async (req, res) => {
    const { courseId, childId } = req.params;
    const parentId = req.user.userId;

    // Security: Check if child belongs to this parent
    const isAuthorized = await UserModel.findOne({ _id: childId, parentId: parentId });
    if (!isAuthorized) {
        throw new AppError(403, "Access Denied: You are not this student's parent.");
    }

    const result = await ReportServices.getDetailedStudentProgress(courseId as string, childId as string );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Child progress details retrieved successfully",
        data: result,
    });
});





// Instructor View: Get a specific student's marks history (Image 1)
const getStudentMarksHistory = catchAsync(async (req, res) => {
  const { courseId, studentId } = req.params;
  const result = await ReportServices.getStudentMarksHistoryFromDB(courseId as string, studentId as string);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student marks history retrieved successfully",
    data: result,
  });
});

// Instructor View: Get a specific student's attendance history (Image 2)
const getStudentAttendanceHistory = catchAsync(async (req, res) => {
  const { courseId, studentId } = req.params;
  const result = await ReportServices.getStudentDetailedAttendanceFromDB(courseId as string, studentId as string);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student attendance history retrieved successfully",
    data: result,
  });
});

// Student View: Get own marks history
const getMyMarksHistory = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.userId; // Logged in student ID from token

  const result = await ReportServices.getStudentMarksHistoryFromDB(courseId as string, studentId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your marks history retrieved successfully",
    data: result,
  });
});

// Student View: Get own attendance history
const getMyAttendanceHistory = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.userId;

  const result = await ReportServices.getStudentDetailedAttendanceFromDB(courseId as string, studentId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your attendance history retrieved successfully",
    data: result,
  });
});






export const ReportControllers = {
  getMyReport,
  getCourseOverview,
  getCourseStudentsStatus,getOverallAcademicStats,getTabularReport,getChildCourseProgress,getChildEnrolledCourses,getStudentProgressForInstructors,  
    getStudentMarksHistory,
  getStudentAttendanceHistory,
  getMyMarksHistory,
  getMyAttendanceHistory
};