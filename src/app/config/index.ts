import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join((process.cwd(), '.env')) });

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  server_url: process.env.SERVER_URL,
  frontend_url: process.env.FRONTEND_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  smtp_from: process.env.SMTP_FROM,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.APP_PASSWARD,
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEYS,
  cloudinary_api_secret: process.env.CLOUDINARY_SECRET_KEYS,
  zoom_client_id: process.env.ZOOM_CLIENT_ID,
  zoom_client_secret: process.env.ZOOM_CLIENT_SECRET,
  zoom_redirect_url: process.env.ZOOM_REDIRECT_URL,
  zoom_webhook_secret: process.env.ZOOM_WEBHOOK_SECRET,

};
