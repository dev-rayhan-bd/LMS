import express from 'express';
import auth from '../../middleware/auth';
import { ReportControllers } from './report.controller';
import { USER_ROLE } from '../Auth/auth.constant';

const router = express.Router();

// Student access for individual progress circles (Image 3)
router.get('/my-report/:courseId', auth('student'), ReportControllers.getMyReport);

// Teacher access for Dashboard Header Counts (Image 1)
router.get('/course-overview/:courseId', auth('teacher', 'assistant'), ReportControllers.getCourseOverview);

// Teacher access for Student Status List (Image 2)
router.get('/student-list/:courseId', auth('teacher', 'assistant'), ReportControllers.getCourseStudentsStatus);

router.get(
  '/overall-stats/:courseId',
  auth('teacher', 'assistant', 'superAdmin'),
  ReportControllers.getOverallAcademicStats
);
router.get(
  '/tabular-report/:courseId',
  auth('teacher', 'assistant', 'superAdmin'),
  ReportControllers.getTabularReport
);


//(Parent Home - Image 2)
router.get(
  '/child-courses/:childId',
  auth(USER_ROLE.parent),
  ReportControllers.getChildEnrolledCourses
);





router.get(
  '/view-progress/:courseId/:studentId',
  auth('teacher', 'assistant', 'superAdmin','student'),
  ReportControllers.getStudentProgressForInstructors
);

// parent (View Progress Page)
router.get(
  '/child-progress/:courseId/:childId',
  auth('parent'),
  ReportControllers.getChildCourseProgress
);







// --- Student Self-Service Routes ---
router.get(
  '/my-marks-history/:courseId', 
  auth(USER_ROLE.student), 
  ReportControllers.getMyMarksHistory
);

router.get(
  '/my-attendance-history/:courseId', 
  auth(USER_ROLE.student), 
  ReportControllers.getMyAttendanceHistory
);


// --- Instructor/Admin View Routes ---


router.get(
  '/student-marks/:courseId/:studentId',
  auth(USER_ROLE.teacher, USER_ROLE.assistant, USER_ROLE.superAdmin,USER_ROLE.parent),
  ReportControllers.getStudentMarksHistory
);


router.get(
  '/student-attendance/:courseId/:studentId',
  auth(USER_ROLE.teacher, USER_ROLE.assistant, USER_ROLE.superAdmin,USER_ROLE.parent),
  ReportControllers.getStudentAttendanceHistory
);







export const ReportRoutes = router;