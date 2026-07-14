import express, { NextFunction, Request, Response } from 'express';


import { AuthControllers } from './auth.controller';


import { USER_ROLE } from './auth.constant';

import { AuthValidation } from './authValidation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import { upload } from '../../middleware/multer';

const router = express.Router();

router.post(
  '/register',
 upload.single('image'),
  (req: Request, res: Response, next: NextFunction) => {
    // console.log("req data--->",req.body.body);
    if (req.body) {
      req.body = JSON.parse(req.body.body);
    }
    next();
  },


  AuthControllers.registerUser,
);
router.post(
  '/resendOtp',
  AuthControllers.resendOtp,
);
router.post('/login',
    validateRequest(AuthValidation.loginValidationSchema),
    auth(USER_ROLE.teacher, USER_ROLE.superAdmin, USER_ROLE.student,USER_ROLE.parent,USER_ROLE.assistant),
    AuthControllers.userLogin
);
router.post('/admin/login',
    validateRequest(AuthValidation.AdminloginValidationSchema),
    auth(USER_ROLE.teacher, USER_ROLE.superAdmin),
    AuthControllers.AdminLogin
);
router.post('/changePassword',
  
    validateRequest(AuthValidation.changePasswordValidationSchema),
    auth(USER_ROLE.teacher, USER_ROLE.superAdmin, USER_ROLE.student,USER_ROLE.parent,USER_ROLE.assistant),
    AuthControllers.changePassword
)
router.post(
  '/refresh-token',
  validateRequest(AuthValidation.refreshTokenValidationSchema),
  AuthControllers.refreshToken,
);
router.post(
  '/forgotPass',
  validateRequest(AuthValidation.forgotPasswordSchema),
  AuthControllers.forgotPassword,
);
router.post(
  '/resetPass',
  validateRequest(AuthValidation.resetPasswordValidationSchema),
  AuthControllers.resetPassword,
);

router.post(
  '/verifyOtp',
  validateRequest(AuthValidation.verifyOtpSchema),
  AuthControllers.verifyYourOTP,
);
router.post(
  '/regOtpVerify',
  validateRequest(AuthValidation.verifyOtpSchema),
  AuthControllers.VerifyOtpForRegistration,
);
router.get(
  '/account-deletion-request',
  AuthControllers.accountDeletionPage
);

export const AuthRoutes = router;
