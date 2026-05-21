import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { TaskModel } from "../Task/task.model";
import { ISubmission } from "./submission.interface";
import { SubmissionModel } from "./submission.model";
import { notifyParentOfStudent, sendPushNotification } from "../../utils/sendNotification";
import QueryBuilder from "../../builder/QueryBuilder";

const submitTaskIntoDB = async (payload: Partial<ISubmission>) => {
  const task = await TaskModel.findById(payload.task);
  if (!task) throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  const isAlreadySubmitted = await SubmissionModel.findOne({ 
    task: payload.task, 
    student: payload.student 
  });

  if (isAlreadySubmitted) {

    throw new AppError(
        httpStatus.BAD_REQUEST, 
        "You have already submitted this homework/exam. You cannot submit it again."
    );
  }

  const now = new Date();
  const endDateTime = new Date(`${task.endDate}T${task.endTime}`);
  payload.submissionStatus = now > endDateTime ? 'late' : 'in time';

  const result = await SubmissionModel.create(payload);
  return result;
};

// Fetch a single submission by its ID
const getSingleSubmissionFromDB = async (submissionId: string) => {
  return await SubmissionModel.findById(submissionId).populate([
    { path: 'student', select: 'fullName image email contact' },
    { path: 'task', select: 'title type details document endDate endTime' },
    { path: 'course', select: 'className subjectName' }
  ]);
};


const getMySubmissionsFromDB = async (
  studentId: string,
  courseId: string,
  query: Record<string, unknown>
) => {
  const { type, status, ...restQuery } = query;


  const taskQueryObj: any = { course: courseId };
  if (type) taskQueryObj.type = type;

  let taskIds: any[] = [];
  

  if (type || status) {
    let tasks = await TaskModel.find(taskQueryObj);

    if (status) {
      tasks = tasks.filter((t: any) => t.status === status);
    }
    
    taskIds = tasks.map(t => t._id);


    if (taskIds.length === 0) {
      return { 
        meta: { page: 1, limit: 10, total: 0, totalPage: 0 }, 
        result: [] 
      };
    }
  }


  const filterCriteria: any = { 
    student: studentId, 
    course: courseId 
  };


  if (type || status) {
    filterCriteria.task = { $in: taskIds };
  }

  const submissionQuery = new QueryBuilder(
    SubmissionModel.find(filterCriteria),
    restQuery
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  submissionQuery.modelQuery.populate([
    { 
      path: 'task', 
      select: 'title type startDate endDate status' 
    },
    { 
      path: 'course', 
      select: 'className subjectName' 
    }
  ]);

  const result = await submissionQuery.modelQuery;
  const meta = await submissionQuery.countTotal();

  return { meta, result };
};




const markSubmissionInDB = async (id: string, payload: Partial<ISubmission>) => {
  const submission = await SubmissionModel.findById(id);
  if (!submission) throw new AppError(httpStatus.NOT_FOUND, "Submission not found");

  const result = await SubmissionModel.findByIdAndUpdate(
    id,
    { ...payload, isMarked: true },
    { new: true }
  );
   if (result) {
    // Notify the specific student
    await sendPushNotification(
      result.student.toString(),
      'Result Published! 🎉',
      `Your marks for the task have been published. Check it now!`,
      'result'
    );
        // 2. Notify Parent
    await notifyParentOfStudent(
      result.student.toString(),
      'Academic Progress Update 📈',
      `[StudentName]'s latest homework/exam results are now available.`,
      'result'
    );
  
  }
  return result;
};

// Fetch all submissions for a specific task with QueryBuilder support


const getSubmissionsByTaskFromDB = async (taskId: string, query: Record<string, unknown>) => {
  const { type, status, ...restQuery } = query;


  const targetTask = await TaskModel.findById(taskId);

  if (!targetTask) {
    return { meta: { page: 1, limit: 10, total: 0, totalPage: 0 }, result: [] };
  }

  if (type && targetTask.type !== type) {
    return { meta: { page: 1, limit: 10, total: 0, totalPage: 0 }, result: [] };
  }

  if (status && (targetTask as any).status !== status) {
    return { meta: { page: 1, limit: 10, total: 0, totalPage: 0 }, result: [] };
  }

  const submissionQuery = new QueryBuilder(
    SubmissionModel.find({ task: taskId }),
    restQuery
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  
  submissionQuery.modelQuery.populate([
    { 
      path: 'student', 
      select: 'fullName image email contact' 
    },
    { 
      path: 'task', 
      select: 'title type status endDate endTime'
    }
  ]);

  const result = await submissionQuery.modelQuery;
  const meta = await submissionQuery.countTotal();

  return { meta, result };
};


export const SubmissionServices = {
  submitTaskIntoDB,
  markSubmissionInDB,
  getSubmissionsByTaskFromDB,
  getMySubmissionsFromDB,getSingleSubmissionFromDB
};