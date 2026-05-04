import axios from 'axios';
import { UserModel } from '../User/user.model';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';

const ZOOM_OAUTH_ENDPOINT = 'https://zoom.us/oauth/token';


const exchangeCodeForToken = async (userId: string, code: string) => {
  const auth = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');
  const response = await axios.post(ZOOM_OAUTH_ENDPOINT, null, {
    params: {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.ZOOM_REDIRECT_URL,
    },
    headers: { Authorization: `Basic ${auth}` },
  });

  const { access_token, refresh_token, expires_in } = response.data;
  await UserModel.findByIdAndUpdate(userId, {
    zoomAccessToken: access_token,
    zoomRefreshToken: refresh_token,
    zoomTokenExpiresAt: new Date(Date.now() + expires_in * 1000),
    isZoomConnected: true
  });
};

// token auto refresh logic when access token is about to expire (within 5 minutes) or already expired
const getValidAccessToken = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user || !user.zoomRefreshToken) throw new AppError(httpStatus.UNAUTHORIZED, "Zoom not connected");

  //if access token is still valid for more than 5 minutes, return it
  if (user.zoomTokenExpiresAt && user.zoomTokenExpiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    return user.zoomAccessToken;
  }

  const auth = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');
  const response = await axios.post(ZOOM_OAUTH_ENDPOINT, null, {
    params: { grant_type: 'refresh_token', refresh_token: user.zoomRefreshToken },
    headers: { Authorization: `Basic ${auth}` },
  });

  const { access_token, refresh_token, expires_in } = response.data;
  await UserModel.findByIdAndUpdate(userId, {
    zoomAccessToken: access_token,
    zoomRefreshToken: refresh_token,
    zoomTokenExpiresAt: new Date(Date.now() + expires_in * 1000),
  });
  return access_token;
};


const createZoomMeeting = async (userId: string, classTitle: string, startTime: string) => {
  const token = await getValidAccessToken(userId);
  const response = await axios.post('https://api.zoom.us/v2/users/me/meetings', {
    topic: classTitle,
    type: 2,
    start_time: startTime,
    duration: 60,
    settings: {
   
      join_before_host: false, 
  waiting_room: true,      
  host_video: true,
  participant_video: true,
  mute_upon_entry: true,
  auto_recording: 'cloud'
    }
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const ZoomServices = { exchangeCodeForToken, getValidAccessToken, createZoomMeeting };