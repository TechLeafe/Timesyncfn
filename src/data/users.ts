export type UserRole = "HR Manager" | "Admin" | "Employee";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatarBg: string;
  avatarUrl?: string;
}

export const USERS: UserProfile[] = [
  {
    id: "dhamini",
    name: "Dhamini",
    role: "HR Manager",
    avatarBg: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "krishnkanth",
    name: "Krishnkanth",
    role: "Admin",
    avatarBg: "linear-gradient(135deg, #10B981 0%, #047857 100%)",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "harshita",
    name: "Harshita",
    role: "Employee",
    avatarBg: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
];

/* Roles that are allowed to create, edit and delete company calendar events */
export const CALENDAR_MANAGE_ROLES: UserRole[] = ["HR Manager", "Admin"];

export const canManageCalendar = (role: UserRole | undefined): boolean =>
  role !== undefined && CALENDAR_MANAGE_ROLES.includes(role);
