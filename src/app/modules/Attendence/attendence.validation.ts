import { z } from 'zod';

const markAttendanceSchema = z.object({
  course: z.string("Course ID is required" ),
  student: z.string("Student ID is required" ),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
time: z.string("Time is required" )
  .regex(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i, "Invalid time format (e.g. 10:30 AM)"),
  status: z.enum(['absent', 'late', 'on time']),
});

// array validation for taking all student attendence
const bulkAttendanceSchema = z.object({
  attendances: z.array(markAttendanceSchema)
});

export const AttendanceValidations = {
  markAttendanceSchema,
  bulkAttendanceSchema
};