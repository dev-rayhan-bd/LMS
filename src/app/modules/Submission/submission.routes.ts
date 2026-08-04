import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middleware/auth';
import { upload } from '../../middleware/multer';
import validateRequest from '../../middleware/validateRequest';
import { SubmissionValidations } from './submission.validation';
import { SubmissionControllers } from './submission.controller';

const router = express.Router();

const parseBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.body) req.body = JSON.parse(req.body.body);
  next();
};

router.patch(
  '/task',
  auth('student'),
  upload.single('answerPdf'),
  parseBody,
  validateRequest(SubmissionValidations.createSubmissionSchema),
  SubmissionControllers.submitTask
);

router.patch(
  '/task/:id',
  auth('student'),
  upload.single('answerPdf'),
  parseBody,
  validateRequest(SubmissionValidations.updateSubmissionSchema),
  SubmissionControllers.resubmitTask
);


router.patch(
  '/mark/:id',
  auth('teacher', 'assistant'),
  upload.single('correctAnswerPdf'),
  parseBody,
  validateRequest(SubmissionValidations.markSubmissionSchema),
  SubmissionControllers.markSubmission
);

router.post(
  '/offline-mark',
  auth('teacher', 'assistant'),
  upload.single('correctAnswerPdf'),
  parseBody,
  validateRequest(SubmissionValidations.offlineMarkSubmissionSchema),
  SubmissionControllers.markOfflineSubmission
);


router.get(
  '/task/:taskId',
  auth('teacher', 'assistant'),
  SubmissionControllers.getSubmissionsByTask
);

// all submission (History)
router.get(
  '/my-submissions/:courseId',
  auth('student'),
  SubmissionControllers.getMySubmissions
);

// single submission for teacher and student
router.get(
  '/:submissionId',
  auth('teacher', 'assistant', 'student'),
  SubmissionControllers.getSingleSubmission
);


export const SubmissionRoutes = router;