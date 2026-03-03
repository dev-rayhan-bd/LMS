export const USER_ROLE = {
  superAdmin: 'superAdmin',
  teacher: 'teacher',
  assistant: 'assistant',
  student: 'student',
  parent: 'parent',
} as const;
export type TUserRole = keyof typeof USER_ROLE;
export const UserStatus = ['in-progress', 'blocked', 'pending'];
