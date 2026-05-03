// src/app/modules/Zoom/zoom.controller.ts

import crypto from 'crypto';
import catchAsync from '../../utils/catchAsync';
import { Request, Response } from 'express';

const handleZoomWebhook = catchAsync(async (req: Request, res: Response) => {
  const { event, payload } = req.body;

//zoom url validation logic
  if (event === 'endpoint.url_validation') {
    const plainToken = payload.plainToken;
    const secretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN; 

    const hash = crypto
      .createHmac('sha256', secretToken!)
      .update(plainToken)
      .digest('hex');

    return res.status(200).json({
      plainToken: plainToken,
      signature: hash,
    });
  }


  if (event === 'meeting.participant_joined') {
     // save participant info to database
     console.log('Participant joined:', payload.object.participant);
  }

  res.status(200).send();
});