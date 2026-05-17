import crypto from "crypto";
import { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../config";
import catchAsync from "../../utils/catchAsync";
import { AttendanceModel } from "../Attendence/attendence.model";
import { ClassModel } from "../Class/class.model";
import { UserModel } from "../User/user.model";
import { ZoomServices } from "./zoom.services";

/**
 * zoom webhook handler (for attendance and status updates)
 */

const handleZoomWebhook = catchAsync(async (req: Request, res: Response) => {
  const { event, payload } = req.body;

  console.log("Received Webhook Event:", event);

  // if (event === 'endpoint.url_validation') {
  //   const plainToken = payload.plainToken;
  //   // const secretToken = config.zoom_webhook_secret;
  //   const secretToken = process.env.ZOOM_WEBHOOK_SECRET;

  //   if (!secretToken) {
  //     return res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Secret missing");
  //   }

  //   const hash = crypto
  //     .createHmac('sha256', secretToken)
  //     .update(plainToken)
  //     .digest('hex');

  //   return res.status(200).json({
  //     plainToken: plainToken,
  //     signature: hash,
  //   });
  // }
  if (event === "endpoint.url_validation") {
    const plainToken = payload?.plainToken;
    const secretToken = process.env.ZOOM_WEBHOOK_SECRET;

    if (!plainToken) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "plainToken missing",
      });
    }

    if (!secretToken) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Zoom webhook secret missing",
      });
    }

    const encryptedToken = crypto
      .createHmac("sha256", secretToken)
      .update(plainToken)
      .digest("hex");

    return res.status(200).json({
      plainToken,
      encryptedToken,
    });
  }

  if (!payload || !payload.object) {
    return res.status(200).send("No action needed for this event structure.");
  }

  const meetingId = payload.object.id?.toString();

  if (event === "meeting.participant_joined" && meetingId) {
    const participant = payload.object.participant;
    const studentEmail = participant.user_email;
    const joinTime = new Date(participant.join_time);

    const [targetClass, student] = await Promise.all([
      ClassModel.findOne({ zoomMeetingId: meetingId }),
      UserModel.findOne({ email: studentEmail, role: "student" }),
    ]);

    if (targetClass && student) {
      const classDateStr = targetClass.date.toISOString().split("T")[0];
      const scheduledStartTime = new Date(
        `${classDateStr} ${targetClass.time}`,
      );
      const bufferThreshold = new Date(
        scheduledStartTime.getTime() + 15 * 60000,
      );

      let attendanceStatus: "on time" | "late" = "on time";
      if (joinTime > bufferThreshold) {
        attendanceStatus = "late";
      }

      await AttendanceModel.findOneAndUpdate(
        { class: targetClass._id, student: student._id },
        {
          class: targetClass._id,
          course: targetClass.course,
          student: student._id,
          status: attendanceStatus,
          date: classDateStr,
          time: joinTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          markedBy: targetClass.createdBy,
        },
        { upsert: true, new: true },
      );
    }
  }

  if (meetingId) {
    if (event === "meeting.started") {
      await ClassModel.findOneAndUpdate(
        { zoomMeetingId: meetingId },
        { zoomStatus: "started" },
      );
    }
    if (event === "meeting.ended") {
      await ClassModel.findOneAndUpdate(
        { zoomMeetingId: meetingId },
        { zoomStatus: "ended" },
      );
    }
    if (event === "recording.completed") {
      const playUrl = payload.object.share_url;
      await ClassModel.findOneAndUpdate(
        { zoomMeetingId: meetingId },
        { recordingLink: playUrl, zoomStatus: "recorded" },
      );
    }
  }

  res.status(200).send();
});

/**
 * zoom oAUTH connection
 */
const zoomCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, state } = req.query; // state = teacher userId

  if (!code || !state) {
    return res
      .status(400)
      .send("Invalid callback: missing code or teacher ID.");
  }

  await ZoomServices.exchangeCodeForToken(state as string, code as string);

  res.send(`
    <html>
      <head>
        <title>Zoom Connected</title>
        <style>
          body { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; text-align: center; }
          h1 { color: #2D8CFF; }
          p { color: #4CAF50; font-size: 18px; }
        </style>
        <script>
       
          setTimeout(function() {
            window.location.href = "educology://zoom-success"; 
          }, 2000);
        </script>
      </head>
      <body>
        <div>
          <h1>Educology Zoom Integration</h1>
          <p>Success! Your Zoom account is now connected.</p>
          <p>Redirecting you back to the app...</p>
          <br>
          <a href="educology://zoom-success" style="text-decoration: none; color: blue;">Click here if you are not redirected automatically</a>
        </div>
      </body>
    </html>
  `);
});

export const ZoomControllers = {
  handleZoomWebhook,
  zoomCallback,
};
