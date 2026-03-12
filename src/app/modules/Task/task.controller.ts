import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import uploadImage from "../../middleware/upload";
import { TaskServices } from "./task.services";
import AppError from "../../errors/AppError";


// const createTask = catchAsync(async (req, res) => {
//   let pdfUrl;
//   if (req.file) {
//     pdfUrl = await uploadImage(req);
//   }

//   const result = await TaskServices.createTaskIntoDB({
//     ...req.body,
//     document: pdfUrl,
//     createdBy: req.user.userId
//   });

//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     success: true,
//     message: `${req.body.type} added successfully`,
//     data: result
//   });
// });


const createTask = catchAsync(async (req, res) => {
  let documents: string[] = [];

 
  if (req.files && Array.isArray(req.files)) {
    const uploadPromises = (req.files as Express.Multer.File[]).map((file) =>
      uploadImage(req, file) 
    );
    documents = await Promise.all(uploadPromises);
  }

  const result = await TaskServices.createTaskIntoDB({
    ...req.body,
    documents: documents, 
    createdBy: req.user.userId
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: `${req.body.type} added successfully with ${documents.length} documents`,
    data: result
  });
});



const getTasksByCourse = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { userId, role } = req.user; // Get from Auth Token
  
  const result = await TaskServices.getTasksByCourseFromDB(
    courseId as string, 
    req.query, // contains possible studentId for parents
    userId,
    role
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Tasks retrieved successfully',
    data: result
  });
});


const getSingleTaskDetail = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user; // Token logic

  const result = await TaskServices.getSingleTaskWithUserStatus(id as string, userId, role);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Task details retrieved successfully',
    data: result
  });
});






export const TaskControllers = {
  createTask,
  getTasksByCourse,getSingleTaskDetail
};