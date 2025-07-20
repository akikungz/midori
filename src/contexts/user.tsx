"use client";
import { User } from "@midori/types/user";
import { createContext, useState } from "react";

export type IUserContext = {
  user: User | null;
  setUser: (user: IUserContext["user"]) => void;
}

export const UserContext = createContext<IUserContext>({
  user: null,
  setUser: () => void 0,
});

export const UserProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const [user, setUser] = useState<IUserContext["user"]>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};