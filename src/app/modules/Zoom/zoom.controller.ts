import crypto from 'crypto';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import config from '../../config';
import catchAsync from '../../utils/catchAsync';
import { AttendanceModel } from '../Attendence/attendence.model';
import { ClassModel } from '../Class/class.model';
import { UserModel } from '../User/user.model';
import { ZoomServices } from './zoom.services';

/**
 * zoom webhook handler (for attendance and status updates)
 */
const handleZoomWebhook = catchAsync(async (req: Request, res: Response) => {
  const { event, payload } = req.body;

  if (event === 'endpoint.url_validation') {
    const plainToken = payload.plainToken;
    const secretToken = config.zoom_webhook_secret;

    if (!secretToken) {
      console.error("ZOOM_WEBHOOK_SECRET is missing in .env");
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send();
    }

    const hash = crypto
      .createHmac('sha256', secretToken)
      .update(plainToken)
      .digest('hex');

    return res.status(200).json({
      plainToken: plainToken,
      signature: hash,
    });
  }

 
  const meetingId = payload.object.id.toString();


  if (event === 'meeting.participant_joined') {
    const participant = payload.object.participant;
    const studentEmail = participant.user_email;
    const joinTime = new Date(participant.join_time);


    const [targetClass, student] = await Promise.all([
      ClassModel.findOne({ zoomMeetingId: meetingId }),
      UserModel.findOne({ email: studentEmail, role: 'student' })
    ]);

    if (targetClass && student) {
      // --- Late Logic  ---
  
      const classDateStr = targetClass.date.toISOString().split('T')[0];
      const scheduledStartTime = new Date(`${classDateStr} ${targetClass.time}`);
      
      // 15 min buffer time
      const bufferThreshold = new Date(scheduledStartTime.getTime() + 15 * 60000);

      let attendanceStatus: 'on time' | 'late' = 'on time';
      if (joinTime > bufferThreshold) {
        attendanceStatus = 'late';
      }
      // --- Late Logic ---

      await AttendanceModel.findOneAndUpdate(
        { class: targetClass._id, student: student._id },
        {
          class: targetClass._id,
          course: targetClass.course,
          student: student._id,
          status: attendanceStatus, // 'on time' or 'late'
          date: classDateStr,
          time: joinTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          markedBy: targetClass.createdBy
        },
        { upsert: true, new: true }
      );
      console.log(`[Attendance] ${student.fullName} marked as ${attendanceStatus}`);
    }
  }

  // (Live Status Update)
  if (event === 'meeting.started') {
    await ClassModel.findOneAndUpdate({ zoomMeetingId: meetingId }, { zoomStatus: 'started' });
    console.log(`[Status] Meeting ${meetingId} started.`);
  }

  
  if (event === 'meeting.ended') {
    await ClassModel.findOneAndUpdate({ zoomMeetingId: meetingId }, { zoomStatus: 'ended' });
    console.log(`[Status] Meeting ${meetingId} ended.`);
  }


  if (event === 'recording.completed') {
    const playUrl = payload.object.share_url; 
    await ClassModel.findOneAndUpdate(
      { zoomMeetingId: meetingId },
      { 
        recordingLink: playUrl, 
        zoomStatus: 'recorded' 
      }
    );
    console.log(`[Recording] Saved for meeting: ${meetingId}`);
  }


  res.status(200).send();
});

/**
 * zoom oAUTH connection
 */
const zoomCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, state } = req.query; // state = teacher userId

  if (!code || !state) {
    return res.status(400).send("Invalid callback: missing code or teacher ID.");
  }


  await ZoomServices.exchangeCodeForToken(state as string, code as string);

  res.send(`
    <div style="text-align:center; padding: 50px; font-family: sans-serif;">
      <h1 style="color: #2D8CFF;">Educology Zoom Integration</h1>
      <p style="font-size: 18px; color: #4CAF50;">Success! Your Zoom account is now connected.</p>
      <p>You can close this tab and return to the app.</p>
    </div>
  `);
});

export const ZoomControllers = {
  handleZoomWebhook,
  zoomCallback,
};