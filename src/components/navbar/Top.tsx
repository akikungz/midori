"use client";
import { useContext } from "react";

import MenuIcon from "@mui/icons-material/Menu";

import { UserContext } from "@midori/contexts/user";
import { SidebarContext } from "@midori/contexts/sidebar";

import { format_name } from "@midori/utils/format";

export const TopNavbar: React.FC = () => {
  const { user } = useContext(UserContext);
  const { toggleSidebar } = useContext(SidebarContext);

  return (
    <div className="py-2 px-0 text-white">
      <nav className="bg-[#8AC5E4] shadow-md rounded-lg p-2">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2 relative">
            <button className="lg:hidden text-white bg-kmutnb-500/80 rounded absolute p-1 -ml-2 cursor-pointer" onClick={toggleSidebar}>
              <MenuIcon />
            </button>
            <h1 className="text-2xl font-bold pl-8 lg:pl-0">FITM Cloud</h1>
            <div className="h-8 w-1 bg-kmutnb-500 rounded hidden lg:block" />
            <span className="font-medium hidden lg:inline">Home</span>
          </div>
          <div className="flex space-x-4 justify-end items-center lg:w-3xs">
            {
              user && (
                <span className="text-sm font-medium text-ellipsis overflow-hidden">
                  {format_name(user.name)}
                </span>
              )
            }
          </div>
        </div>
      </nav>
    </div>
  );
}

export default TopNavbar;