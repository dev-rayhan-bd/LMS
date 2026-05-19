import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../Auth/auth.constant';
import { upload } from '../../middleware/multer';
import { CourseControllers } from './course.controller';

const router = express.Router();

const parseBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.body) req.body = JSON.parse(req.body.body);
  next();
};

// Admin Only - Actions
router.post('/create', auth(USER_ROLE.superAdmin), upload.single('image'), parseBody, CourseControllers.createCourse);

router.patch('/update-info/:id', auth(USER_ROLE.superAdmin), upload.single('image'), parseBody, CourseControllers.updateCourseInfo);

router.patch('/assign-teacher/:id', auth(USER_ROLE.superAdmin), CourseControllers.assignTeacher);

router.patch('/assign-assistant/:id', auth(USER_ROLE.superAdmin), CourseControllers.assignAssistant);

router.patch('/add-student/:id', auth(USER_ROLE.superAdmin), CourseControllers.addStudent);

router.patch('/remove-student/:id', auth(USER_ROLE.superAdmin), CourseControllers.removeStudent);

router.delete('/delete/:id', auth(USER_ROLE.superAdmin), CourseControllers.deleteCourse);

router.patch(
  '/add-students/:id', 
  auth(USER_ROLE.superAdmin), 
  
  CourseControllers.addMultipleStudents
);

router.patch(
  '/remove-students/:id', 
  auth(USER_ROLE.superAdmin), 
  CourseControllers.removeMultipleStudents
);
// Teacher/Assistant Dashboard Stats
router.get(
  '/teacher-stats',
  auth('teacher', 'assistant'),
  CourseControllers.getTeacherDashboardStats
);


// Get All (Role Based)
router.get('/my-courses', auth(USER_ROLE.teacher, USER_ROLE.assistant, USER_ROLE.student), CourseControllers.getMyCourses);
router.get('/all', auth(USER_ROLE.superAdmin), CourseControllers.getAllCourses);

export const CourseRoutes = router;