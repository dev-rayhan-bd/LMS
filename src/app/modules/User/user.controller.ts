import { Request, Response } from "express";

import { UserServices } from "./user.services";
import httpStatus from "http-status";

import { TEditProfile } from "./user.constant";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import uploadImage from "../../middleware/upload";

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  console.log("req.user", req.user);
  const id = req?.user?.userId;

  let imageUrl: string | undefined;

  if (req.file) {
    imageUrl = await uploadImage(req);
  }

  const body = req.body || {};

  const payload = {
    ...body,
    image: imageUrl ? imageUrl : undefined,
  };
  const result = await UserServices.updateProfileFromDB(id, payload);
  console.log("result--->", result);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const meId = req?.user?.userId;
  const result = await UserServices.getMyProfileFromDB(meId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrive successfully!",
    data: result,
  });
});
const getSingleProfile = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserServices.getMyProfileFromDB(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrive successfully!",
    data: result,
  });
});
const getAllUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getAllUserFromDB(req?.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrive successfully!",
    data: result,
  });
});

const deleteProfile = catchAsync(async (req: Request, res: Response) => {
  const meId = req?.user?.userId;

  const result = await UserServices.deletePrifileFromDB(meId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile deleted successfully!",
    data: result,
  });
});
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await UserServices.deleteUserFromDB(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User deleted successfully!",
    data: result,
  });
});

const toggleUserBlock = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const result = await UserServices.blockUserFromDB(id as string, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User is now ${status}`,
    data: result,
  });
});
const approveUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserServices.approveUserFromDB(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User approved successfully",
    data: result,
  });
});
const assignParent = catchAsync(async (req, res) => {
  const result = await UserServices.assignParentToStudentInDB(req.user.userId, req.body.parentId);
  sendResponse(res, { statusCode: 200, success: true, message: "Parent assigned successfully", data: result });
});
const getMyChildren = catchAsync(async (req: Request, res: Response) => {
  const parentId = req.user.userId; 

  const result = await UserServices.getMyChildrenFromDB(parentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Children retrieved successfully!",
    data: result,
  });
});
export const UserControllers = {
  updateProfile,

  getMyProfile,
  deleteProfile,
  getAllUser,
  getSingleProfile,
  deleteUser,
  toggleUserBlock,approveUser,assignParent,getMyChildren
 
};
