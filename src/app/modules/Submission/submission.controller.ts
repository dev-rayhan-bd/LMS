import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import uploadImage from "../../middleware/upload";
import { SubmissionServices } from "./submission.services";
import AppError from "../../errors/AppError";


const submitTask = catchAsync(async (req, res) => {
  const payload: any = { ...req.body, student: req.user.userId };
  
  if (req.file) {
    payload.answerPdf = await uploadImage(req);
  }

  const result = await SubmissionServices.submitTaskIntoDB(payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Task submitted successfully',
    data: result
  });
});

const resubmitTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  let answerPdf;
  if (req.file) {
    answerPdf = await uploadImage(req);
  }

  const result = await SubmissionServices.resubmitTaskIntoDB(id as string, req.user.userId, {
    ...req.body,
    ...(answerPdf && { answerPdf })
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Task resubmitted successfully',
    data: result
  });
});

const markSubmission = catchAsync(async (req, res) => {
  const { id } = req.params;
  let correctAnswerPdf;
  if (req.file) {
    correctAnswerPdf = await uploadImage(req);
  }

  const result = await SubmissionServices.markSubmissionInDB(id as string, {
    ...req.body,
    correctAnswerPdf
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Submission marked successfully',
    data: result
  });
});

const markOfflineSubmission = catchAsync(async (req, res) => {
  let correctAnswerPdf;
  if (req.file) {
    correctAnswerPdf = await uploadImage(req);
  }

  const result = await SubmissionServices.markOfflineSubmissionInDB({
    ...req.body,
    correctAnswerPdf
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Offline submission marked successfully',
    data: result
  });
});

const getSubmissionsByTask = catchAsync(async (req, res) => {
  const { taskId } = req.params;
  
  // Pass taskId and the query object from request
  const result = await SubmissionServices.getSubmissionsByTaskFromDB(taskId as string, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Submissions retrieved successfully',
    data: result
  });
});

// Get single submission detail
const getSingleSubmission = catchAsync(async (req, res) => {
  const { submissionId } = req.params;
  const result = await SubmissionServices.getSingleSubmissionFromDB(submissionId as string);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Submission not found");
  }

  // Security: If user is a student, ensure they only see their own submission
  if (req.user.role === 'student' && result.student._id.toString() !== req.user.userId) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to view this submission");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Submission details retrieved successfully',
    data: result
  });
});

// Get logged in student's submission history
const getMySubmissions = catchAsync(async (req, res) => {
 const { courseId } = req.params;
  const studentId = req.user.userId;
  const result = await SubmissionServices.getMySubmissionsFromDB( studentId,
    courseId as string,
    req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Submission history retrieved successfully',
    data: result
  });
});



export const SubmissionControllers = {
  submitTask,
  resubmitTask,
  markSubmission,
  markOfflineSubmission,
  getSubmissionsByTask,
  getMySubmissions,
  getSingleSubmission
};