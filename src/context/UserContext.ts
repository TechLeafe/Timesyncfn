import { createContext, useContext } from "react";
import type { UserProfile } from "../data/users";

export interface UserContextValue {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
}

export const UserContext = createContext<UserContextValue | undefined>(undefined);

/** Access the signed-in user (role based permissions) from any component. */
export function useCurrentUser(): UserContextValue {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useCurrentUser must be used inside a <UserProvider>");
  }

  return context;
}
