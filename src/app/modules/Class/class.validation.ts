import { z } from 'zod';
// export const ClassValidation = z.object({
//   course: z.string(),
//   title: z.string(),
//   date: z.string().transform(v => new Date(v)),
//   time: z.string(),
//   details: z.string(),
//   link: z.string().url(),
// });
export const ClassValidation = z.object({
  course: z.string("Course ID is required"),
  title: z.string("Title is required" ),
  date: z.string("Date is required" ),
  time: z.string("Time is required" ),
  details: z.string("Details are required" ),
  link: z.string().optional(),
  isZoomMeeting: z.boolean().optional().default(false), 
});