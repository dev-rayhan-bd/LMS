import admin from 'firebase-admin';
import { NotificationModel } from '../modules/Notification/notification.model';
import { UserModel } from '../modules/User/user.model';
import { CourseModel } from '../modules/Course/course.model';

type TNotificationType = 'task' | 'class' | 'announcement' | 'result' | 'general';
export const sendPushNotification = async (
  receiverId: string,
  title: string,
  message: string,
  type: TNotificationType
) => {
  try {
    // 1. Save to Database for in-app notification list
    await NotificationModel.create({
     user: receiverId,
      title,
      message,
      type
    });

    // 2. Send Push Notification via FCM
    const user = await UserModel.findById(receiverId).select('fcmToken');
    
    if (user && user.fcmToken) {
      const payload = {
        notification: { title, body: message },
             apns: {
    payload: {
      aps: {
        sound: "default", 
        badge: 1,        
      },
    },
  },

  android: {
    notification: {
      sound: "default",
    },
  },
        token: user.fcmToken,
      };
      await admin.messaging().send(payload);
    }
  } catch (error) {
    console.error("FCM Notification Error:", error);
  }
};


export const sendNotificationToCourse = async (
  courseId: string,
  title: string,
  message: string,
  type: TNotificationType
) => {
  const course = await CourseModel.findById(courseId).populate('students');
  if (course && course.students) {
    await Promise.all(
      course.students.map((student: any) => 
        sendPushNotification(student._id.toString(), title, message, type)
      )
    );
  }
}; 

// New Method Added
export const sendNotificationToAdmins = async (
  title: string,
  message: string,
  type: TNotificationType
) => {
  try {
    const admins = await UserModel.find({ role: 'superAdmin' });
    if (admins && admins.length > 0) {
      await Promise.all(
        admins.map((adminUser) =>
          sendPushNotification(adminUser._id.toString(), title, message, type)
        )
      );
    }
  } catch (error) {
    console.error("Admin Notification Error:", error);
  }
};
// Helper to notify a linked parent
export const notifyParentOfStudent = async (
  studentId: string,
  title: string,
  message: string,
  type: 'task' | 'class' | 'announcement' | 'result' | 'general'
) => {
  const student = await UserModel.findById(studentId).select('parentId fullName');
  if (student && student.parentId) {
    await sendPushNotification(
      student.parentId.toString(),
      title,
      message.replace("[StudentName]", student.fullName || "Your child"),
      type
    );
  }
};