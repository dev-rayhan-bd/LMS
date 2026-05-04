import uploadImage from "../../middleware/upload";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ClassServices } from "./class.services";
import httpStatus from 'http-status';

// const createClass = catchAsync(async (req, res) => {
//   let documents: string[] = [];

//   // Check if multiple files are uploaded
//   if (req.files && Array.isArray(req.files)) {
//     const uploadPromises = (req.files as Express.Multer.File[]).map((file) =>
//       uploadImage(req, file) // Reusing your existing uploadImage utility
//     );
//     documents = await Promise.all(uploadPromises);
//   }

//   const result = await ClassServices.createClassIntoDB({ 
//     ...req.body, 
//     documents, // Saving the array of URLs
//     createdBy: req.user.userId 
//   });

//   sendResponse(res, { 
//     statusCode: 201, 
//     success: true, 
//     message: 'Class added with multiple documents', 
//     data: result 
//   });
// });

const createClass = catchAsync(async (req, res) => {
  let documents: string[] = [];


  if (req.files && Array.isArray(req.files)) {
    const uploadPromises = (req.files as Express.Multer.File[]).map((file) =>
      uploadImage(req, file)
    );
    documents = await Promise.all(uploadPromises);
  }


  const result = await ClassServices.createClassIntoDB(
    { 
      ...req.body, 
      documents 
    }, 
    req.user.userId 
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: req.body.isZoomMeeting 
      ? 'Class created with automated Zoom link' 
      : 'Class created with manual link',
    data: result,
  });
});
const getClassesByCourse = catchAsync(async (req, res) => {

 const { courseId } = req.params;

  const result = await ClassServices.getClassesByCourse(
    courseId as string, 
    req.query 
  );
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Courses retrieved', data: result });
});




export const ClassController={
    createClass,getClassesByCourse
}