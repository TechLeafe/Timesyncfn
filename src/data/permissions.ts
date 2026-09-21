export type UserType = 1 | 2 | 3;

export const HR: UserType = 1;
export const ADMIN: UserType = 2;
export const EMPLOYEE: UserType = 3;

export const permissions = {
  employeeCreation: {
    view: [HR, ADMIN],
    create: [HR, ADMIN],
    edit: [HR, ADMIN],
    delete: [HR, ADMIN],
  },

  attendance: {
    viewAll: [HR, ADMIN],
    viewOwn: [EMPLOYEE],
  },

  calendar: {
    view: [HR, ADMIN, EMPLOYEE],
    manage: [HR, ADMIN],
  },

  checkInOut: {
    viewAll: [HR, ADMIN],
    viewOwn: [EMPLOYEE],
  },

  leavesPermissions: {
    viewAll: [HR, ADMIN],
    manage: [HR, ADMIN],
    viewOwn: [EMPLOYEE],
  },
};