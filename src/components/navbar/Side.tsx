"use client";
import { useContext } from "react";
import Image from "next/image";
import Link from "next/link";

import HomeIcon from "@mui/icons-material/Home";
import NoteAdd from "@mui/icons-material/NoteAdd";
import SettingsIcon from "@mui/icons-material/Settings";
import FolderIcon from "@mui/icons-material/Folder";

import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';

import { UserContext } from "@midori/contexts/user";
import { cn } from "@midori/utils/format";
import { SidebarContext } from "@midori/contexts/sidebar";

const SideNavButton: React.FC<{
  href: string;
  label: string;
  icon?: React.ReactNode;
}> = ({ href, label, icon }) => {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center px-2 py-1 hover:bg-orange-500/80 rounded font-medium drop-shadow-md transition-colors"
      >
        {icon && <span className="inline-block mr-2">{icon}</span>}
        {label}
      </Link>
    </li>
  );
}

export default function SideNavbar() {
  const { user } = useContext(UserContext);
  const { isOpen, toggleSidebar } = useContext(SidebarContext);

  return (
    <aside className={
      cn(
        "max-w-72 w-full p-2 absolute lg:block lg:relative top-0 left-0 h-full z-10",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "transition-transform duration-300 ease-in-out"
      )
    }>
      <nav className="bg-[#8AC5E4] shadow-md rounded-lg p-2 h-full">
        <div className="flex flex-col items-center p-4 relative">
          <Image
            src="/icon.png"
            alt="Midori Logo"
            width={704}
            height={252}
            className="rounded-full w-full"
          />

          <button className="lg:hidden absolute top-0 right-0 text-white bg-orange-500/60 rounded p-1.5 cursor-pointer" onClick={toggleSidebar}>
            <KeyboardDoubleArrowLeftIcon />
          </button>
        </div>

        <ul className="space-y-2 text-white">
          <SideNavButton href="/" label="Home" icon={<HomeIcon />} />
          {
            user && (
              user.role == "admin" ? (
                <SideNavButton href="/request" label="Request Instance" icon={<NoteAdd />} />
              ) : (
                <>
                  <SideNavButton href="/request" label="Request Instance" icon={<NoteAdd />} />
                  <SideNavButton href="/manage" label="Manage Instance" icon={<SettingsIcon />} />
                  <SideNavButton href="/storage" label="Cloud Storage" icon={<FolderIcon />} />
                </>
              )
            )
          }
        </ul>
      </nav>
    </aside>
  );
}