import bcrypt from 'bcrypt';
import { UserModel } from '../modules/User/user.model';
import config from '../config';

const seedSuperAdmin = async () => {
  try {
    // Check if any superAdmin already exists
    const existingSuperAdmin = await UserModel.findOne({ role: 'superAdmin' });

    if (!existingSuperAdmin) {
      console.log('No super admin found. Creating default super admin...');

      const superAdminData = {
        firstName: config.super_admin_first_name || 'Super',
        lastName: config.super_admin_last_name || 'Admin',
        fullName: `${config.super_admin_first_name || 'Super'} ${config.super_admin_last_name || 'Admin'}`,
        email: config.super_admin_email || 'admin@lms.com',
        password: config.super_admin_password || 'Admin@123',
        role: 'superAdmin' as const,
        status: 'in-progress',
        fcmToken: 'seed-token',
        isOtpVerified: true,
      };

      await UserModel.create(superAdminData);

      console.log(`✅ Super admin created successfully with email: ${superAdminData.email}`);
    } else {
      console.log('✅ Super admin already exists. Skipping seed.');
    }
  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
  }
};

export default seedSuperAdmin;
