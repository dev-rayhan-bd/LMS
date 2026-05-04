import express from 'express';
import { ZoomControllers } from './zoom.controller';

const router = express.Router();


router.get('/callback', ZoomControllers.zoomCallback);


router.post('/webhook', ZoomControllers.handleZoomWebhook);

export const ZoomRoutes = router;