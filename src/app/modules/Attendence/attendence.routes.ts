import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { AttendanceControllers } from './attendence.controller';


const router = express.Router();

router.post(
  '/mark',
  auth('teacher', 'assistant'),
  // validateRequest(AttendanceValidations.markBulkSchema), // optional validation logic
  AttendanceControllers.markAttendance
);

router.get(
  '/all',
  auth('teacher', 'assistant'),
  AttendanceControllers.getAllAttendance
);


router.get(
  '/my-attendance',
  auth('student'),
  AttendanceControllers.getMyAttendance
);

router.get(
  '/stats/:courseId',
  auth('teacher', 'assistant', 'superAdmin'),
  AttendanceControllers.getOverallStats
);

router.get(
  '/my-stats/:courseId', 
  auth('student'), 
  AttendanceControllers.getMyStats
);


router.get(
  '/course-attendance/:classId',
  auth('teacher', 'assistant', 'superAdmin'),
  AttendanceControllers.getCourseAttendanceList
);

router.get(
  '/class-attendance/:classId',
  auth('teacher', 'assistant', 'superAdmin'), 
  AttendanceControllers.getClassAttendanceList
);


export const AttendanceRoutes = router;