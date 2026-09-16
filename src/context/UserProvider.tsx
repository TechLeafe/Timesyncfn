import { useMemo, useState, type ReactNode } from "react";
import { USERS, type UserProfile } from "../data/users";
import { UserContext } from "./UserContext";

function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(USERS[0]);

  const value = useMemo(() => ({ currentUser, setCurrentUser }), [currentUser]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserProvider;
