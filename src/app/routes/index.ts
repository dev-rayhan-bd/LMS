import { Router } from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { UserRoutes } from "../modules/User/user.routes";
import aboutRouter from "../modules/about/about.route";
import privacyPolicyRouter from "../modules/PrivacyPolicy/privacyPolicy.routes";
import termsRouter from "../modules/Terms/terms.route";
import { FaqRoutes } from "../modules/FAQ/faq.routes";
import { ContactRoutes } from "../modules/ContactUs/contact.route";
import { CourseRoutes } from "../modules/Course/course.routes";
import { ClassRoutes } from "../modules/Class/class.routes";
import { TaskRoutes } from "../modules/Task/task.routes";
import { SubmissionRoutes } from "../modules/Submission/submission.routes";
import { AttendanceRoutes } from "../modules/Attendence/attendence.routes";
import { ReportRoutes } from "../modules/Report/report.routes";
import { NotificationRoutes } from "../modules/Notification/notification.routes";
import { AnnouncementRoutes } from "../modules/Announcement/announcement.routes";
import { AdminRoutes } from "../modules/Admin/admin.routes";
import { ZoomRoutes } from "../modules/Zoom/zoom.routes";

const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/notification",
    route: NotificationRoutes,
  },
  {
    path: "/about",
    route: aboutRouter,
  },
  {
    path: "/privacy",
    route: privacyPolicyRouter,
  },
  {
    path: "/terms",
    route: termsRouter,
  },
  {
    path: "/faq",
    route: FaqRoutes,
  },
  {
    path: "/contact",
    route: ContactRoutes,
  },
  {
    path: "/courses",
    route: CourseRoutes,
  },
  {
    path: "/class",
    route: ClassRoutes,
  },
  {
    path: "/task",
    route: TaskRoutes,
  },
  {
    path: "/submit",
    route: SubmissionRoutes,
  },
  {
    path: "/attendance",
    route: AttendanceRoutes,
  },
  {
    path: "/report",
    route: ReportRoutes,
  },
  {
    path: '/announcements',
    route: AnnouncementRoutes
  },
  {
    path: '/dashboard',
    route: AdminRoutes
  },
    {
    path: "/zoom", 
    route: ZoomRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
