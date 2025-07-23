"use client";
import { useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import HomeIcon from "@mui/icons-material/Home";
import NoteAdd from "@mui/icons-material/NoteAdd";
import SettingsIcon from "@mui/icons-material/Settings";
import FolderIcon from "@mui/icons-material/Folder";

import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';

import { SidebarContext } from "@midori/contexts/sidebar";
import { UserContext } from "@midori/contexts/user";

import { cn } from "@midori/utils/format";

const SideNavButton: React.FC<{
  href: string;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
}> = ({ href, label, icon, active }) => {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center px-2 py-1 rounded font-medium drop-shadow-md transition-colors",
          active ? "bg-kmutnb-600 text-white hover:bg-kmutnb-500" : "hover:bg-kmutnb-500",
        )}
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
  const pathname = usePathname();

  return (
    <aside className={
      cn(
        "max-w-72 w-full p-2 absolute lg:block lg:relative top-0 left-0 h-full z-10",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "transition-transform duration-300 ease-in-out"
      )
    }>
      <nav className="bg-fitm-200 shadow-2xl rounded-lg p-2 h-full">
        <div className="flex flex-col items-center p-4 relative">
          <Image
            src="/icon.png"
            alt="Midori Logo"
            width={704}
            height={252}
            className="rounded-full w-full"
            priority
          />

          <button className="lg:hidden absolute top-0 right-0 text-white bg-kmutnb-500/80 rounded p-1 cursor-pointer" onClick={toggleSidebar}>
            <KeyboardDoubleArrowLeftIcon />
          </button>
        </div>

        <ul className="space-y-2 text-white">
          <SideNavButton href="/" label="Home" icon={<HomeIcon />} active={pathname === "/"} />
          {
            user && (
              user.role == "student" ? (
                <SideNavButton href="/request" label="Request Instance" icon={<NoteAdd />} active={pathname === "/request"} />
              ) : (
                <>
                  <SideNavButton href="/request" label="Request Instance" icon={<NoteAdd />} active={pathname === "/request"} />
                  <SideNavButton href="/manage" label="Manage Instance" icon={<SettingsIcon />} active={pathname === "/manage"} />
                  <SideNavButton href="/storage" label="Cloud Storage" icon={<FolderIcon />} active={pathname === "/storage"} />
                </>
              )
            )
          }
        </ul>
      </nav>
    </aside>
  );
}