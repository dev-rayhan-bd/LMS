import { z } from 'zod';

const createAnnouncementSchema = z.object({
  courseId: z.string("Course ID is required" ),
  details: z.string("Details are required" ),
  link: z.string().url().optional().or(z.literal('')),
});

const createCommentSchema = z.object({
  comment: z.string("Comment is required"),

  announcementId: z.string().optional(),
  classId: z.string().optional(),
  taskId: z.string().optional(),
  parentCommentId: z.string().optional(),
});

export const AnnouncementValidations = {
  createAnnouncementSchema,
  createCommentSchema
};