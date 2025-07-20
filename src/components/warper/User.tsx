"use client";
import { useContext, useEffect, useState } from "react";

import { IUserContext, UserContext } from "@midori/contexts/user";

import { eden } from "@midori/libs/momoi";

import { FullScreenLoading } from "./Loading";
import { useSession } from "@midori/libs/auth";

export const User: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const userContext = useContext(UserContext);

  const { data } = useSession();

  useEffect(() => {
    eden.api.v1.me.get()
      .then((response) => {
        if (response.status === 200) {
          if (response.data && response.data.user) {
            userContext.setUser(response.data.user as IUserContext["user"]);
            return response.data.user;
          }

          throw new Error("User data is not available");
        } else {
          console.error("Failed to fetch user data:", response.data);
          window.location.href = "/sign-in"; // Redirect to login if not authenticated
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
        window.location.href = "/sign-in"; // Redirect to login on error
      });
  }, []);

  useEffect(() => {
    if (data && data.user) {
      setIsLoading(false);
    }
  }, [data]);

  return <FullScreenLoading isLoading={isLoading} children={children} />;
}

export default User;