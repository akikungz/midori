"use client";
import { createContext, useState } from "react";

export interface ISidebarContext {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export const SidebarContext = createContext<ISidebarContext>({
  isOpen: false,
  toggleSidebar: () => {},
});

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const toggleSidebar = () => setIsOpen((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};