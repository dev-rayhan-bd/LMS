import { z } from 'zod';

const createSubmissionSchema = z.object({
  task: z.string("Task ID is required"),
  course: z.string("Course ID is required"),
});

const markSubmissionSchema = z.object({
  marks: z.number("Marks are required").min(0),
  totalMarks: z.number("Total marks are required").min(1),
  feedback: z.string().optional(),
});

export const SubmissionValidations = {
  createSubmissionSchema,
  markSubmissionSchema
};