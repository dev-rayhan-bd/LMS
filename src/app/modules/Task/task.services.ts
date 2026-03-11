import QueryBuilder from "../../builder/QueryBuilder";
import { sendNotificationToCourse } from "../../utils/sendNotification";
import { CommentModel } from "../Announcement/announcement.model";
import { SubmissionModel } from "../Submission/submission.model";
import { ITask } from "./task.interface";
import { TaskModel } from "./task.model";

const createTaskIntoDB = async (payload: ITask) => {
  const result = await TaskModel.create(payload);
    await sendNotificationToCourse(
    payload.course.toString(),
    `New ${payload.type.toUpperCase()}! 📝`,
    `A new ${payload.type} "${payload.title}" has been posted.`,
    'task'
  );
  return result;
};

const getAllTasksFromDB = async (query: Record<string, unknown>) => {
  const taskQuery = new QueryBuilder(
    TaskModel.find().populate('course createdBy'),
    query
  )
    .search(['title', 'type'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await taskQuery.modelQuery;
  const meta = await taskQuery.countTotal();
  return { meta, result };
};


// const getTasksByCourseFromDB = async (
//   courseId: string, 
//   query: Record<string, unknown>,
//   userId: string,
//   role: string
// ) => {
//   // 1. Initialize QueryBuilder to fetch tasks
//   const taskQuery = new QueryBuilder(
//     TaskModel.find({ course: courseId }).populate({
//       path: 'createdBy',
//       select: 'fullName image'
//     }),
//     query
//   )
//     .search(['title'])
//     .filter()
//     .sort()
//     .paginate()
//     .fields();

//   const tasks = await taskQuery.modelQuery;
//   const meta = await taskQuery.countTotal();

//   // 2. Logic for Student or Parent to see userStatus
//   if (role === 'student' || role === 'parent') {
    
//     let targetStudentId = userId;

//     // If it's a parent, they must provide the studentId (child's ID) in query
//     if (role === 'parent') {
//       if (!query.studentId) {
//         return { meta, result: tasks }; // Return tasks without status if no studentId provided
//       }
//       targetStudentId = query.studentId as string;
//     }

//     // Fetch all submissions of the target student for this course
//     const studentSubmissions = await SubmissionModel.find({ 
//       student: targetStudentId, 
//       course: courseId 
//     }).select('task');

//     const submittedTaskIds = studentSubmissions.map(s => s.task.toString());

//     // Map through tasks and inject the userStatus field
//     const resultWithStatus = tasks.map((task: any) => {
//       const taskObj = task.toObject();
//       const now = new Date();
      
//       // Handle potential space or formatting issues in AM/PM time
//       const endDateTime = new Date(`${task.endDate} ${task.endTime}`);

//       let userStatus = "Due Soon"; // Default status

//       if (submittedTaskIds.includes(task._id.toString())) {
//         userStatus = "Done";
//       } else if (now > endDateTime) {
//         userStatus = "Missing";
//       }

//       return {
//         ...taskObj,
//         userStatus // Injected status for UI
//       };
//     });

//     return { meta, result: resultWithStatus };
//   }

//   // 3. For Teachers/Assistants, return normal results without userStatus
//   return { meta, result: tasks };
// };


const getTasksByCourseFromDB = async (
  courseId: string, 
  query: Record<string, unknown>,
  userId: string,
  role: string
) => {

  const taskQuery = new QueryBuilder(
    TaskModel.find({ course: courseId }).populate({
      path: 'createdBy',
      select: 'fullName image'
    }) .populate({
      path: 'comments',
      match: { parentCommentId: null },
      populate: [
        { path: 'user', select: 'fullName image role' }, 
        { 
          path: 'replies', 
          populate: { path: 'user', select: 'fullName image role' } 
        }
      ]
    }),
    query
  )
    .search(['title'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const tasks = await taskQuery.modelQuery;
  const meta = await taskQuery.countTotal();

  const tasksWithComments = await Promise.all(tasks.map(async (task: any) => {
    const taskObj = task.toObject();
    const comments = await CommentModel.find({ taskId: task._id, parentCommentId: null })
      .populate('user', 'fullName image role')
      .populate({
        path: 'replies',
        populate: { path: 'user', select: 'fullName image role' }
      });

    return { ...taskObj, comments };
  }));


  if (role === 'student' || role === 'parent') {
    let targetStudentId = userId;

    if (role === 'parent') {
      if (!query.studentId) {
        
        return { meta, result: tasksWithComments };
      }
      targetStudentId = query.studentId as string;
    }


    const studentSubmissions = await SubmissionModel.find({ 
      student: targetStudentId, 
      course: courseId 
    }).select('task');

    const submittedTaskIds = studentSubmissions.map(s => s.task.toString());

    const resultWithStatus = tasksWithComments.map((task: any) => {
      const now = new Date();
      const endDateTime = new Date(`${task.endDate} ${task.endTime}`);

      let userStatus = "Due Soon"; // Default

      if (submittedTaskIds.includes(task._id.toString())) {
        userStatus = "Done";
      } else if (now > endDateTime) {
        userStatus = "Missing";
      }

      return {
        ...task,
        userStatus
      };
    });

    return { meta, result: resultWithStatus };
  }

  
  return { meta, result: tasksWithComments };
};


// Fetch single task details with conditional submission info


const getSingleTaskWithUserStatus = async (taskId: string, userId: string, role: string) => {
  // 1. Fetch the task with teacher details
  const task = await TaskModel.findById(taskId).populate({
    path: 'createdBy',
    select: 'fullName image'
  }).lean();

  if (!task) return null;

  // 2. If the user is NOT a student, return the task without submissionInfo
  if (role !== 'student') {
    return task;
  }

  // 3. Logic for students only: determine submission status
  let submissionStatus = "pending"; 
  let isSubmitted = false;

  const submission = await SubmissionModel.findOne({ task: taskId, student: userId });
  
  if (submission) {
    isSubmitted = true;
    submissionStatus = "submitted";
  } else {
    const now = new Date();
    const endDateTime = new Date(`${task.endDate} ${task.endTime}`);
    
    // If deadline passed and not submitted, mark as "missing"
    if (now > endDateTime) {
      submissionStatus = "missing";
    }
  }

  // 4. Return task with submissionInfo only for students
  return {
    ...task,
    submissionInfo: {
      isSubmitted,
      status: submissionStatus
    }
  };
};









export const TaskServices = {
  createTaskIntoDB,
  getAllTasksFromDB,
  getTasksByCourseFromDB,getSingleTaskWithUserStatus
};