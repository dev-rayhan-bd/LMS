import mongoose from "mongoose";
import httpStatus from "http-status";
import { TaskModel } from "../Task/task.model";
import { SubmissionModel } from "../Submission/submission.model";
import { StudentProgressModel } from "./report.model";
import { AttendanceModel } from "../Attendence/attendence.model";
import { CourseModel } from "../Course/course.model";
import { UserModel } from "../User/user.model";
import AppError from "../../errors/AppError";
import { ClassModel } from "../Class/class.model";

const syncAndGetStudentProgress = async (
  courseId: string,
  studentId: string,
) => {
  // 1. Calculate Attendance Rate (%)
  const attendanceRecords = await AttendanceModel.find({
    course: courseId,
    student: studentId,
  });
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(
    (r) => r.status === "on time" || r.status === "late",
  ).length;
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  // 2. Fetch all tasks for the course
  const allTasks = await TaskModel.find({ course: courseId });
  const totalTasksCount = allTasks.length;

  // 3. Fetch all submissions by the student in this course
  const submissions = await SubmissionModel.find({
    course: courseId,
    student: studentId,
  });

  // 4. Calculate Average Grade as Percentage (%)
  const markedSubmissions = submissions.filter((s) => s.isMarked);
  const totalMarksObtained = markedSubmissions.reduce(
    (acc, curr) => acc + (curr.marks || 0),
    0,
  );
  // Calculating the mean of marks obtained (Assuming marks are entered out of 100)
  const avgGrade =
    markedSubmissions.length > 0
      ? totalMarksObtained / markedSubmissions.length
      : 0;

  // 5. Calculate Homework Submission Rate (%)
  const submittedTaskIds = submissions.map((s) => s.task.toString());
  const homeworkCompletedRate =
    totalTasksCount > 0 ? (submittedTaskIds.length / totalTasksCount) * 100 : 0;

  // 6. Calculate Overdue Tasks Rate (%)
  const now = new Date();
  const overdueTasksCount = allTasks.filter((task) => {
    const endDateTime = new Date(`${task.endDate}T${task.endTime}`);
    return now > endDateTime && !submittedTaskIds.includes(task._id.toString());
  }).length;
  const overdueRate =
    totalTasksCount > 0 ? (overdueTasksCount / totalTasksCount) * 100 : 0;

  // 7. Status Determination Logic (Priority: Critical > Attention > Behind > On Track)
  let status: "on track" | "behind" | "attention" | "critical" = "on track";
    
 
const hasActivityStarted = totalDays > 0 || overdueTasksCount > 0 || markedSubmissions.length > 0;

  if (hasActivityStarted) {
   // Critical if Attendance < 70% or Avg Grade < 40%
    if (attendanceRate < 70 || (markedSubmissions.length > 0 && avgGrade < 40)) {
      status = "critical";
    } 
      // Attention if Attendance < 80% or 3+ overdue tasks
    else if (attendanceRate < 80 || overdueTasksCount >= 3) {
      status = "attention";
    } 
    else if (attendanceRate < 90 || overdueTasksCount >= 1) {
      status = "behind";
    }
  } else {
  // Behind if Attendance < 90% or 1+ overdue task
    status = "on track";
  }




  






  // 8. Update or Create progress record in Database
  const progressData = {
    status,
    attendanceRate: parseFloat(attendanceRate.toFixed(2)),
    homeworkCompletedRate: parseFloat(homeworkCompletedRate.toFixed(2)),
    avgGrade: parseFloat(avgGrade.toFixed(2)), // Now stored as percentage
    overdueRate: parseFloat(overdueRate.toFixed(2)),
    totalTasks: totalTasksCount,
    completedTasks: submittedTaskIds.length,
  };

  const result = await StudentProgressModel.findOneAndUpdate(
    { course: courseId, student: studentId },
    progressData,
    { upsert: true, new: true },
  );

  return result;
};

// const getCourseDashboardOverview = async (courseId: string) => {
//   // 1. Fetch the course to get the total number of enrolled students
//   const course = await CourseModel.findById(courseId);
//   if (!course) {
//     throw new Error("Course not found");
//   }
//   const totalEnrolled = course.students.length;

//   // 2. Aggregate existing progress records from database
//   const stats = await StudentProgressModel.aggregate([
//     { $match: { course: new mongoose.Types.ObjectId(courseId) } },
//     {
//       $group: {
//         _id: "$status",
//         count: { $sum: 1 }
//       }
//     }
//   ]);

//   // 3. Extract counts for specific statuses
//   const attention = stats.find(s => s._id === 'attention')?.count || 0;
//   const behind = stats.find(s => s._id === 'behind')?.count || 0;
//   const critical = stats.find(s => s._id === 'critical')?.count || 0;
//   const recordedOnTrack = stats.find(s => s._id === 'on track')?.count || 0;

//   // 4. Logic: Anyone not in 'attention', 'behind', or 'critical' is 'on track'
//   // This ensures the summary matches the total student list in your UI
//   const totalNonOnTrack = attention + behind + critical;
//   const onTrack = totalEnrolled - totalNonOnTrack;

//   return {
//     onTrack: onTrack >= 0 ? onTrack : 0,
//     attention,
//     behind,
//     critical,
//     totalStudents: totalEnrolled
//   };
// };


const getCourseDashboardOverview = async (courseId: string) => {

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new Error("Course not found");
  }


  const enrolledStudentIds = course.students; 
  const progressRecords = await StudentProgressModel.find({
    course: courseId,
    student: { $in: enrolledStudentIds } 
  }).lean();

  let onTrack = 0;
  let attention = 0;
  let behind = 0;
  let critical = 0;


  enrolledStudentIds.forEach((studentId) => {
    const progress = progressRecords.find(
      (p) => p.student.toString() === studentId.toString()
    );

    if (progress) {
  
      const isFresh = 
        progress.attendanceRate === 0 && 
        progress.avgGrade === 0 && 
        progress.overdueRate === 0;

      if (isFresh) {
        onTrack++;
      } else {
        if (progress.status === 'on track') onTrack++;
        else if (progress.status === 'attention') attention++;
        else if (progress.status === 'behind') behind++;
        else if (progress.status === 'critical') critical++;
      }
    } else {
   
      onTrack++;
    }
  });

  return {
    onTrack,
    attention,
    behind,
    critical,
    totalStudents: enrolledStudentIds.length
  };
};






// const getStudentListWithStatus = async (courseId: string) => {
//     // 1. Fetch course and populate students, teacher, and assistant
//     const course = await CourseModel.findById(courseId)
//         .populate('students')
//         .populate({
//             path: 'teacherId',
//             select: 'fullName image contact email'
//         })
//         .populate({
//             path: 'assistantId',
//             select: 'fullName image contact email'
//         })
//         .lean();
    
//     if (!course) {
//         throw new Error("Course not found");
//     }

//     // 2. Fetch all progress records for this course
//     const progressRecords = await StudentProgressModel.find({ course: courseId }).lean();

//     // 3. Map through all enrolled students
//     const studentList = (course.students as any[]).map((student: any) => {
//         const progress = progressRecords.find(
//             (p) => p.student.toString() === student._id.toString()
//         );

//         if (progress) {
//             return {
//                 _id: progress._id,
//                 student: {
//                     _id: student._id,
//                     fullName: student.fullName,
//                     image: student.image,
//                     contact: student.contact
//                 },
//                 status: progress.status,
//                 attendanceRate: progress.attendanceRate,
//                 avgGrade: progress.avgGrade,
//                 homeworkCompletedRate: progress.homeworkCompletedRate,
//                 overdueRate: progress.overdueRate,
//                 updatedAt: progress.updatedAt
//             };
//         }

//         return {
//             student: {
//                 _id: student._id,
//                 fullName: student.fullName,
//                 image: student.image,
//                 contact: student.contact
//             },
//             status: 'on track',
//             attendanceRate: 0,
//             avgGrade: 0,
//             homeworkCompletedRate: 0,
//             overdueRate: 0,
//             updatedAt: new Date()
//         };
//     });

//     // 4. Return both Instructor Info and the Student List
//     return {
//         instructorInfo: {
//             teacher: course.teacherId || null,
//             assistant: course.assistantId || null
//         },
//         studentList: studentList
//     };
// };

const getStudentListWithStatus = async (courseId: string) => {
    const course = await CourseModel.findById(courseId)
        .populate('students')
        .populate({ path: 'teacherId', select: 'fullName image contact email' })
        .populate({ path: 'assistantId', select: 'fullName image contact email' })
        .lean();
    
    if (!course) {
        throw new Error("Course not found");
    }

    const progressRecords = await StudentProgressModel.find({ course: courseId }).lean();

    const studentList = (course.students as any[]).map((student: any) => {
        const progress = progressRecords.find(
            (p) => p.student.toString() === student._id.toString()
        );

    
        if (progress) {
          
            const isFreshStudent = 
                progress.attendanceRate === 0 && 
                progress.avgGrade === 0 && 
                progress.overdueRate === 0;

            return {
                _id: progress._id,
                student: {
                    _id: student._id,
                    fullName: student.fullName,
                    image: student.image,
                    contact: student.contact
                },
                status: isFreshStudent ? 'on track' : progress.status, 
                attendanceRate: progress.attendanceRate,
                avgGrade: progress.avgGrade,
                homeworkCompletedRate: progress.homeworkCompletedRate,
                overdueRate: progress.overdueRate,
                updatedAt: progress.updatedAt
            };
        }

      
        return {
            student: {
                _id: student._id,
                fullName: student.fullName,
                image: student.image,
                contact: student.contact
            },
            status: 'on track',
            attendanceRate: 0,
            avgGrade: 0,
            homeworkCompletedRate: 0,
            overdueRate: 0,
            updatedAt: new Date()
        };
    });

    return {
        instructorInfo: {
            teacher: course.teacherId || null,
            assistant: course.assistantId || null
        },
        studentList: studentList
    };
};

const getOverallCourseAcademicStats = async (courseId: string) => {
  const course = await CourseModel.findById(courseId);
  if (!course) throw new Error("Course not found");

  const totalStudents = course.students.length;
  if (totalStudents === 0) {
    return { attendanceRate: 0, homeworkRate: 0, avgGrade: 0, overdueRate: 0, totalEnrolled: 0 };
  }

  // 1. Overall Attendance Rate for the whole class
  const attendanceStats = await AttendanceModel.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $in: ["$status", ["on time", "late"]] }, 1, 0] }
        }
      }
    }
  ]);
  const attendanceRate = attendanceStats.length > 0 
    ? (attendanceStats[0].presentCount / attendanceStats[0].totalRecords) * 100 
    : 0;

  // 2. Total Tasks and Submissions data
  const allTasks = await TaskModel.find({ course: courseId });
  const totalTasksCount = allTasks.length;
  const potentialSubmissions = totalTasksCount * totalStudents;

  const allSubmissions = await SubmissionModel.find({ course: courseId });
  
  // 3. Overall Homework Submission Rate
  const homeworkRate = potentialSubmissions > 0 
    ? (allSubmissions.length / potentialSubmissions) * 100 
    : 0;

  // 4. Overall Average Grade
  const markedSubmissions = allSubmissions.filter(s => s.isMarked);
  const totalMarks = markedSubmissions.reduce((acc, curr) => acc + (curr.marks || 0), 0);
  const avgGrade = markedSubmissions.length > 0 
    ? (totalMarks / markedSubmissions.length) 
    : 0;

  // 5. Overall Overdue Rate
  const now = new Date();
  let totalOverdueCount = 0;

  allTasks.forEach(task => {
    const endDateTime = new Date(`${task.endDate}T${task.endTime}`);
    if (now > endDateTime) {
      // Find students who did NOT submit this specific task
      const submissionsForThisTask = allSubmissions.filter(
        s => s.task.toString() === task._id.toString()
      ).length;
      totalOverdueCount += (totalStudents - submissionsForThisTask);
    }
  });

  const overdueRate = potentialSubmissions > 0 
    ? (totalOverdueCount / potentialSubmissions) * 100 
    : 0;

  return {
    totalEnrolled: totalStudents,
    attendanceRate: parseFloat(attendanceRate.toFixed(2)),
    homeworkRate: parseFloat(homeworkRate.toFixed(2)),
    avgGrade: parseFloat(avgGrade.toFixed(2)),
    overdueRate: parseFloat(overdueRate.toFixed(2))
  };
};

const getDetailedTabularReport = async (courseId: string, searchTerm: string = '') => {
  // 1. Fetch Course and filter students by search name if provided
  const course = await CourseModel.findById(courseId).populate({
    path: 'students',
    match: searchTerm ? { fullName: { $regex: searchTerm, $options: 'i' } } : {},
    select: 'fullName image contact'
  });

  if (!course) throw new Error("Course not found");

  // 2. Fetch all metadata for calculations
  const allTasks = await TaskModel.find({ course: courseId });
  const homeworkTasks = allTasks.filter(t => t.type === 'homework');
  const examTasks = allTasks.filter(t => t.type === 'exam');
  
  const allAttendance = await AttendanceModel.find({ course: courseId });
  const allSubmissions = await SubmissionModel.find({ course: courseId });

  // 3. Unique dates count for total attendance days
  const totalAttendanceDays = [...new Set(allAttendance.map(a => a.date))].length;

  // 4. Map students to the specific UI format
  const report = course.students.map((student: any) => {
    const studentId = student._id.toString();

    // Attendance Calculation: "09/10 (90%)"
    const studentAttendance = allAttendance.filter(a => 
      a.student.toString() === studentId && (a.status === 'on time' || a.status === 'late')
    ).length;
    const attPercentage = totalAttendanceDays > 0 ? Math.round((studentAttendance / totalAttendanceDays) * 100) : 0;
    const attendanceString = `${String(studentAttendance).padStart(2, '0')}/${String(totalAttendanceDays).padStart(2, '0')} (${attPercentage}%)`;

    // Homework Calculation: "09/10"
    const studentHwSubmissions = allSubmissions.filter(s => 
      s.student.toString() === studentId && 
      homeworkTasks.some(h => h._id.toString() === s.task.toString())
    ).length;
    const hwCompletedString = `${String(studentHwSubmissions).padStart(2, '0')}/${String(homeworkTasks.length).padStart(2, '0')}`;
    
    // H.W. Pending Calculation: "01"
    const hwPendingCount = homeworkTasks.length - studentHwSubmissions;
    const hwPendingString = String(hwPendingCount > 0 ? hwPendingCount : 0).padStart(2, '0');

    // Exam Grade Calculation: "88%"
    const studentExamMarks = allSubmissions.filter(s => 
      s.student.toString() === studentId && 
      s.isMarked &&
      examTasks.some(e => e._id.toString() === s.task.toString())
    );
    const totalExamMarks = studentExamMarks.reduce((acc, curr) => acc + (curr.marks || 0), 0);
    const avgExamGrade = studentExamMarks.length > 0 ? Math.round(totalExamMarks / studentExamMarks.length) : 0;

    return {
      studentName: student.fullName,
      attendance: attendanceString,
      hwCompleted: hwCompletedString,
      hwPending: hwPendingString,
      examGrade: `${avgExamGrade}%`
    };
  });

  return report;
};




const getChildEnrolledCoursesFromDB = async (parentId: string, childId: string) => {
  // 1. Security Check: Verify if this child belongs to this parent
  const child = await UserModel.findOne({ _id: childId, parentId: parentId });
  if (!child) {
    throw new AppError(httpStatus.FORBIDDEN, "Unauthorized: This student is not linked to your account.");
  }

  // 2. Find courses where the child is enrolled
  const courses = await CourseModel.find({ students: childId })
    .populate({ path: 'teacherId', select: 'fullName' }) // Image 2 requires Teacher Name
    .lean();

  return {
    childInfo: {
      fullName: child.fullName,
      image: child.image,
      contact: child.contact
    },
    enrolledCourses: courses
  };
};


// Helper function to get missing tasks message for the current week
const getMissingTasksMessage = async (courseId: string, studentId: string, studentName: string) => {
    const now = new Date();
    
    // Get start and end of current week (Sunday to Saturday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Find all tasks in this course that ended/end this week
    const tasksThisWeek = await TaskModel.find({
        course: courseId,
        endDate: { 
            $gte: startOfWeek.toISOString().split('T')[0], 
            $lte: endOfWeek.toISOString().split('T')[0] 
        }
    });

    // Find submissions for these tasks by this student
    const submittedTaskIds = (await SubmissionModel.find({
        student: studentId,
        task: { $in: tasksThisWeek.map(t => t._id) }
    })).map(s => s.task.toString());

    // Count tasks that are already past their deadline but not submitted
    const missingCount = tasksThisWeek.filter(task => {
        const endDateTime = new Date(`${task.endDate} ${task.endTime}`);
        return now > endDateTime && !submittedTaskIds.includes(task._id.toString());
    }).length;

    if (missingCount > 0) {
        return `${studentName} has ${missingCount} missing task${missingCount > 1 ? 's' : ''} this week`;
    }
    return null;
};



// Main Service for "View Progress" screen
const getDetailedStudentProgress = async (courseId: string, studentId: string) => {
    // 1. Fetch Student and Populate Parent
    const student = await UserModel.findById(studentId)
        .populate({
            path: 'parentId',
            select: 'fullName image contact email'
        })
        .select('fullName image contact role parentId')
        .lean();

    if (!student) throw new Error("Student not found");

    // 2. Fetch Course and Populate Instructors
    const course = await CourseModel.findById(courseId)
        .populate({ path: 'teacherId', select: 'fullName image contact' })
        .populate({ path: 'assistantId', select: 'fullName image contact' })
        .lean();

    // 3. Get Academic Stats (The 4 Boxes)
    const progressStats = await syncAndGetStudentProgress(courseId, studentId);

    // 4. Get Dynamic Missing Task Message
    const missingTaskMessage = await getMissingTasksMessage(courseId, studentId, student.fullName || 'Student');

    return {
        studentInfo: student,
        parentInfo: student.parentId || null,
        instructors: {
            teacher: course?.teacherId || null,
            assistant: course?.assistantId || null
        },
        academicStats: progressStats,
        alertMessage: missingTaskMessage
    };
};



const getChildCourseProgressFromDB = async (parentId: string, childId: string, courseId: string) => {
  // 1. Verify Parent-Child Relationship
  const isAuthorized = await UserModel.findOne({ _id: childId, parentId: parentId });
  if (!isAuthorized) {
    throw new AppError(httpStatus.FORBIDDEN, "Access Denied");
  }

  // 2. Reuse syncAndGetStudentProgress to get latest calculated stats
  const progress = await syncAndGetStudentProgress(courseId, childId);

  // 3. Get Course & Instructor Details
  const course = await CourseModel.findById(courseId)
    .populate({ path: 'teacherId', select: 'fullName image contact' })
    .populate({ path: 'assistantId', select: 'fullName image contact' })
    .lean();

  return {
    student: isAuthorized, // Student Name, Img, Contact
    teacher: course?.teacherId || null,
    assistant: course?.assistantId || null,
    progress: progress // All 4 rates (Attendance, HW, Grade, Overdue)
  };
};

// Service to get academic history (Image 1: View All Marks)
const getStudentMarksHistoryFromDB = async (courseId: string, studentId: string) => {
  // 1. Get all tasks for this course
  const allTasks = await TaskModel.find({ course: courseId })
    .populate({ path: 'createdBy', select: 'fullName image' })
    .sort({ createdAt: -1 }).lean();

  // 2. Get student submissions for these tasks
  const submissions = await SubmissionModel.find({ course: courseId, student: studentId }).lean();

  // 3. Merge data to create the UI format
  const marksHistory = allTasks.map(task => {
    const submission = submissions.find(s => s.task.toString() === task._id.toString());
    const now = new Date();
    const endDateTime = new Date(`${task.endDate} ${task.endTime}`);

    let uiStatus = "Not Submitted";
    if (submission) {
      uiStatus = submission.submissionStatus === 'in time' ? "Submitted on time" : "Late submitted";
    } else if (now > endDateTime) {
      uiStatus = "Missing";
    }

    return {
      taskId: task._id,
      title: task.title,
      type: task.type,
      deadline: `${task.endDate} ${task.endTime}`,
      status: uiStatus,
      isMarked: submission?.isMarked || false,
      marks: submission?.marks || 0,
      feedback: submission?.feedback || null,
      correctAnswerPdf: submission?.correctAnswerPdf || null,
      answerPdf: submission?.answerPdf || null,
      teacher: task.createdBy,
      postedAt: task.createdAt
    };
  });

  return marksHistory;
};

// Service to get detailed attendance history (Image 2: View Attendance)
const getStudentDetailedAttendanceFromDB = async (courseId: string, studentId: string) => {
  // 1. Fetch all classes for this course
  const classes = await ClassModel.find({ course: courseId }).sort({ date: 1 });
  
  // 2. Fetch student's attendance records
  const attendances = await AttendanceModel.find({ course: courseId, student: studentId });

  // 3. Map attendance to each class
  const classWiseAttendance = classes.map(cls => {
    // Format the date to match attendance date string YYYY-MM-DD
    const classDate = cls.date.toISOString().split('T')[0];
    const record = attendances.find(a => a.date === classDate);

    return {
      className: cls.title,
      classStart: `${classDate} | ${cls.time}`,
      status: record ? record.status : "Not Marked"
    };
  });

  // 4. Calculate Stats for the top of the screen
  const totalClasses = classes.length;
  const onTime = attendances.filter(a => a.status === 'on time').length;
  const late = attendances.filter(a => a.status === 'late').length;
  const absent = attendances.filter(a => a.status === 'absent').length;

  const getPercent = (val: number) => totalClasses > 0 ? Math.round((val / totalClasses) * 100) : 0;

  return {
    totalCompletedClass: totalClasses,
    stats: {
      onTime: { count: onTime, percentage: getPercent(onTime) },
      late: { count: late, percentage: getPercent(late) },
      absent: { count: absent, percentage: getPercent(absent) }
    },
    attendanceList: classWiseAttendance
  };
};




export const ReportServices = {
  syncAndGetStudentProgress,
  getCourseDashboardOverview,
  getStudentListWithStatus,
  getOverallCourseAcademicStats,
  getDetailedTabularReport,getChildEnrolledCoursesFromDB,getChildCourseProgressFromDB,getDetailedStudentProgress,  getStudentMarksHistoryFromDB,
  getStudentDetailedAttendanceFromDB
};
