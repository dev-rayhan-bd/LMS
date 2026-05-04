import crypto from 'crypto';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { ZoomServices } from './zoom.services';

const zoomCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, state } = req.query; // state 

  if (!code || !state) {
    return res.status(400).send("Invalid request: missing code or state.");
  }

  await ZoomServices.exchangeCodeForToken(state as string, code as string);


  res.send(`
    <html>
      <body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">
        <div style="text-align:center;">
          <h2 style="color: green;">Zoom Connected Successfully! 🎉</h2>
          <p>You can now close this tab and return to the app.</p>
        </div>
      </body>
    </html>
  `);
});


const handleZoomWebhook = catchAsync(async (req: Request, res: Response) => {
  const { event, payload } = req.body;

  if (event === 'endpoint.url_validation') {
    const hash = crypto
      .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN!)
      .update(payload.plainToken)
      .digest('hex');

    return res.status(200).json({
      plainToken: payload.plainToken,
      signature: hash,
    });
  }


  res.status(200).send();
});

export const ZoomControllers = {
  handleZoomWebhook,
  zoomCallback,
};