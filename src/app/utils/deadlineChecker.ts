import cron from 'node-cron';
import { TaskModel } from '../modules/Task/task.model';
import { SubmissionModel } from '../modules/Submission/submission.model';
import { CourseModel } from '../modules/Course/course.model';
import { UserModel } from '../modules/User/user.model';
import { sendPushNotification } from './sendNotification';

type TNotificationType = 'task' | 'class' | 'announcement' | 'result' | 'general';

/**
 * Finds all overdue tasks where deadline has passed,
 * checks which students haven't submitted,
 * and notifies teacher / assistant / parents.
 */
const checkOverdueTasks = async () => {
  try {
    const now = new Date();

    // Get all tasks
    const tasks = await TaskModel.find({});

    for (const task of tasks) {
      // Build deadline Date from task's string fields (YYYY-MM-DD + HH:mm)
      const endDateTime = new Date(`${task.endDate} ${task.endTime}`);

      // Skip tasks whose deadline hasn't passed yet
      if (now <= endDateTime) continue;

      // Resolve the course (need teacherId, assistantId, students)
      const course = await CourseModel.findById(task.course)
        .select('teacherId assistantId students className subjectName');
      if (!course) continue;

      // Find students who already submitted for this task
      const submissions = await SubmissionModel.find({ task: task._id }).select('student');
      const submittedIds = new Set(submissions.map((s) => s.student.toString()));

      // Find students who have NOT submitted
      const enrolledStudents = (course.students || []) as any[];
      const missingStudents = enrolledStudents.filter(
        (sid: any) => !submittedIds.has(sid.toString())
      );

      // Nothing to notify if everyone submitted
      if (missingStudents.length === 0) continue;

      const taskTypeLabel = task.type === 'exam' ? 'Exam' : 'Homework';
      const title = `⚠️ ${taskTypeLabel} Deadline Passed`;
      const message = `${missingStudents.length} student(s) in ${course.className} - ${course.subjectName} have NOT submitted "${task.title}".`;

      // ──────────────────────────────────────────────
      // 1) Notify Teacher
      // ──────────────────────────────────────────────
      if (course.teacherId) {
        await sendPushNotification(
          course.teacherId.toString(),
          title,
          message,
          'general' as TNotificationType
        );
      }

      // ──────────────────────────────────────────────
      // 2) Notify Assistant
      // ──────────────────────────────────────────────
      if (course.assistantId) {
        await sendPushNotification(
          course.assistantId.toString(),
          title,
          message,
          'general' as TNotificationType
        );
      }

      // ──────────────────────────────────────────────
      // 3) Notify Parents of missing students
      // ──────────────────────────────────────────────
      for (const studentId of missingStudents) {
        const student = await UserModel.findById(studentId)
          .select('fullName parentIds');

        if (student && student.parentIds && student.parentIds.length > 0) {
          const parentMsg = `${student.fullName || 'Your child'} has NOT submitted "${task.title}" (${taskTypeLabel}) for ${course.className} - ${course.subjectName}. Deadline has passed.`;

          for (const parentId of student.parentIds) {
            await sendPushNotification(
              parentId.toString(),
              title,
              parentMsg,
              'general' as TNotificationType
            );
          }
        }
      }

      console.log(
        `⏰ [DeadlineChecker] Notified about "${task.title}" — ${missingStudents.length} missing submission(s)`
      );
    }
  } catch (error) {
    console.error('❌ [DeadlineChecker] Error:', error);
  }
};

/**
 * Start the deadline checker cron job.
 * Runs every 10 minutes.
 */
export const startDeadlineChecker = () => {
  // Run every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    console.log('⏰ [DeadlineChecker] Running scheduled check...');
    checkOverdueTasks();
  });

  console.log('⏰ [DeadlineChecker] Cron job registered (every 10 minutes)');
};
