import axios from 'axios';
import { UserModel } from '../User/user.model';

const exchangeCodeForToken = async (userId: string, code: string) => {
  const ZOOM_OAUTH_ENDPOINT = 'https://zoom.us/oauth/token';

  // Client ID এবং Secret কে Base64 এ কনভার্ট করা
  const auth = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64');

  const response = await axios.post(ZOOM_OAUTH_ENDPOINT, null, {
    params: {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.ZOOM_REDIRECT_URL,
    },
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const { access_token, refresh_token, expires_in } = response.data;

 
  await UserModel.findByIdAndUpdate(userId, {
    zoomAccessToken: access_token,
    zoomRefreshToken: refresh_token,
    zoomTokenExpiresAt: new Date(Date.now() + expires_in * 1000),
  });

  return response.data;
};

export const ZoomServices = {
  exchangeCodeForToken,
};