import mongoose from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import { IAttendance } from "./attendence.interface";
import { AttendanceModel } from "./attendence.model";
import { notifyParentOfStudent } from "../../utils/sendNotification";
import { CourseModel } from "../Course/course.model";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { ClassModel } from "../Class/class.model";



// const markAttendanceInDB = async (attendances: IAttendance[]) => {
//   const results = [];
//   for (const data of attendances) {
//     const res = await AttendanceModel.findOneAndUpdate(
//       { course: data.course, student: data.student, date: data.date },
//       data,
//       { upsert: true, new: true }
//     );
//       // Notify Parent about individual attendance status
//     if (res) {
//         await notifyParentOfStudent(
//             data.student.toString(),
//             'Attendance Alert 🔔',
//             `[StudentName] has been marked "${data.status}" for today's class.`,
//             'general'
//         );
//     }
//     results.push(res);
//   }
//   return results;
// };
const markAttendanceInDB = async (attendances: IAttendance[]) => {
  const results = [];
  
  for (const data of attendances) {

    const isClassBelongsToCourse = await ClassModel.findOne({
      _id: data.class,
      course: data.course
    });

    if (!isClassBelongsToCourse) {
      throw new AppError(
        httpStatus.BAD_REQUEST, 
        `Class ID ${data.class} does not belong to Course ID ${data.course}`
      );
    }


    const res = await AttendanceModel.findOneAndUpdate(
      { 
        class: data.class, 
        student: data.student 
      }, 
      data,
      { upsert: true, new: true }
    );

  
    if (res) {
        await notifyParentOfStudent(
            data.student.toString(),
            'Attendance Alert 🔔',
            `Your child has been marked "${data.status}" for class: ${isClassBelongsToCourse.title}`,
            'general'
        );
    }

    results.push(res);
  }
  return results;
};

const getAllAttendanceFromDB = async (query: Record<string, unknown>) => {
  const attendanceQuery = new QueryBuilder(
    AttendanceModel.find(),
    query
  )
    .filter()
    .sort()
    .paginate()
    .fields();
 attendanceQuery.modelQuery.populate([
    {
      path: 'course',
      select: 'className subjectName'
    },
    {
      path: 'markedBy',
      select: 'fullName image' 
    }
  ]);
  const result = await attendanceQuery.modelQuery;
  const meta = await attendanceQuery.countTotal();
  return { meta, result };
};


const getStudentAttendanceFromDB = async (studentId: string, query: Record<string, unknown>) => {
  const attendanceQuery = new QueryBuilder(
    AttendanceModel.find({ student: studentId }),
    query
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  attendanceQuery.modelQuery.populate([
    {
      path: 'course',
      select: 'className subjectName'
    },
    {
      path: 'markedBy',
      select: 'fullName image' 
    }
  ]);

  const result = await attendanceQuery.modelQuery;
  const meta = await attendanceQuery.countTotal();
  return { meta, result };
};




const getAttendanceStatsFromDB = async (courseId: string, studentId?: string) => {
  const matchQuery: any = { course: new mongoose.Types.ObjectId(courseId) };
  

  if (studentId) {
    matchQuery.student = new mongoose.Types.ObjectId(studentId);
  }

  const stats = await AttendanceModel.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  // set default value
  const counts = {
    absent: stats.find(s => s._id === 'absent')?.count || 0,
    late: stats.find(s => s._id === 'late')?.count || 0,
    onTime: stats.find(s => s._id === 'on time')?.count || 0,
  };

  const total = counts.absent + counts.late + counts.onTime;

  // percentage calc (Division by zero )
  const calculatePercentage = (value: number) => 
    total > 0 ? parseFloat(((value / total) * 100).toFixed(2)) : 0;

  return {
    course: courseId,
    student: studentId || "All Students",
    totalDays: total,
    counts,
    percentages: {
      absent: calculatePercentage(counts.absent),
      late: calculatePercentage(counts.late),
      onTime: calculatePercentage(counts.onTime),
      attendanceRate: calculatePercentage(counts.onTime + counts.late) 
    }
  };
};











// const getCourseAttendanceListFromDB = async (courseId: string, date: string) => {

//   const course = await CourseModel.findById(courseId).populate({
//     path: 'students',
//     select: 'fullName image contact'
//   });

//   if (!course) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
//   }


//   const attendanceRecords = await AttendanceModel.find({
//     course: courseId,
//     date: date
//   });


//   const studentList = (course.students as any[]).map((student) => {
//     const record = attendanceRecords.find(
//       (r) => r.student.toString() === student._id.toString()
//     );

//     return {
//       student: student,
//       status: record ? record.status : "Not Marked", 
//       time: record ? "12:00PM" : "--:--"
//     };
//   });


//   const totalStudents = course.students.length;
//   const onTimeCount = studentList.filter(s => s.status === 'on time').length;
//   const lateCount = studentList.filter(s => s.status === 'late').length;
//   const absentCount = studentList.filter(s => s.status === 'absent').length;

//   return {
//     totalStudents,
//     stats: {
//       onTime: { count: onTimeCount, percentage: totalStudents > 0 ? Math.round((onTimeCount / totalStudents) * 100) : 0 },
//       late: { count: lateCount, percentage: totalStudents > 0 ? Math.round((lateCount / totalStudents) * 100) : 0 },
//       absent: { count: absentCount, percentage: totalStudents > 0 ? Math.round((absentCount / totalStudents) * 100) : 0 }
//     },
//     studentList
//   };
// };




const getCourseAttendanceListFromDB = async (classId: string) => {

  const targetClass = await ClassModel.findById(classId);
  if (!targetClass) {
    throw new AppError(httpStatus.NOT_FOUND, 'Class not found');
  }


  const course = await CourseModel.findById(targetClass.course).populate({
    path: 'students',
    select: 'fullName image contact _id'
  });

  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Associated course not found');
  }


  const attendanceRecords = await AttendanceModel.find({
    class: classId
  });


  const studentList = (course.students as any[]).map((student) => {

    const record = attendanceRecords.find(
      (r) => r.student.toString() === student._id.toString()
    );

    return {
      student: {
        _id: student._id,
        fullName: student.fullName,
        image: student.image,
        contact: student.contact
      },
      status: record ? record.status : "Not Marked", 
      time: record ? record.time : "--:--", 
      attendanceId: record ? record._id : null
    };
  });


  const totalStudents = course.students.length;
  const onTimeCount = studentList.filter(s => s.status === 'on time').length;
  const lateCount = studentList.filter(s => s.status === 'late').length;
  const absentCount = studentList.filter(s => s.status === 'absent').length;


  const getPercent = (count: number) => 
    totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;

  return {
    totalStudents,
    stats: {
      onTime: { 
        count: onTimeCount, 
        percentage: getPercent(onTimeCount) 
      },
      late: { 
        count: lateCount, 
        percentage: getPercent(lateCount) 
      },
      absent: { 
        count: absentCount, 
        percentage: getPercent(absentCount) 
      }
    },
    studentList
  };
};

const getClassAttendanceListFromDB = async (classId: string) => {

  const targetClass = await ClassModel.findById(classId);
  if (!targetClass) throw new AppError(httpStatus.NOT_FOUND, 'Class not found');

  
  const course = await CourseModel.findById(targetClass.course).populate({
    path: 'students',
    select: 'fullName image contact _id'
  });

  if (!course) throw new AppError(httpStatus.NOT_FOUND, 'Associated course not found');


  const attendanceRecords = await AttendanceModel.find({ class: classId });

 
  const validStudents = (course.students as any[]).filter(s => s !== null);


  const studentList = validStudents.map((student) => {
    const record = attendanceRecords.find(
      (r) => r.student.toString() === student._id.toString()
    );
    return {
      student,
      status: record ? record.status : "Not Marked",
      time: record ? record.time : "--:--",
      attendanceId: record ? record._id : null
    };
  });


  const totalStudents = validStudents.length;
  const onTimeCount = studentList.filter(s => s.status === 'on time').length;
  const lateCount = studentList.filter(s => s.status === 'late').length;
  const absentCount = studentList.filter(s => s.status === 'absent').length;


  const getPercent = (count: number) => 
    totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;

  return {
    totalStudents,
    stats: {
      onTime: { 
        count: onTimeCount, 
        percentage: getPercent(onTimeCount) 
      },
      late: { 
        count: lateCount, 
        percentage: getPercent(lateCount) 
      },
      absent: { 
        count: absentCount, 
        percentage: getPercent(absentCount) 
      }
    },
    studentList 
  };
};


export const AttendanceServices = {
  markAttendanceInDB,
  getAllAttendanceFromDB,
  getStudentAttendanceFromDB,
  getAttendanceStatsFromDB,  getCourseAttendanceListFromDB,getClassAttendanceListFromDB
};