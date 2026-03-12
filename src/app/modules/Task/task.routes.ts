import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middleware/auth';
import { upload } from '../../middleware/multer';
import validateRequest from '../../middleware/validateRequest';
import { TaskValidations } from './task.validation';
import { TaskControllers } from './task.controller';

const router = express.Router();

const parseBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.body) req.body = JSON.parse(req.body.body);
  next();
};

router.post(
  '/create',
  auth('teacher', 'assistant'),
 upload.array('documents', 10),
  parseBody,
  validateRequest(TaskValidations.createTaskValidationSchema),
  TaskControllers.createTask
);

router.get(
  '/:courseId',
  auth('teacher', 'assistant', 'student'),
  TaskControllers.getTasksByCourse
);

router.get(
  '/details/:id',
  auth('teacher', 'assistant', 'student'),
  TaskControllers.getSingleTaskDetail
);


export const TaskRoutes = router;