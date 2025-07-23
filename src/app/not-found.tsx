"use client";
import Image from "next/image";
import Link from "next/link";

import HomeIcon from "@mui/icons-material/Home";

export const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-gray-100">
      <div className="max-w-md w-full p-6 rounded-lg">
        <Image
          src="/Icon.png"
          alt="Midori Logo"
          width={704}
          height={252}
          className="mx-auto mb-4"
          priority
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-2xl">404</span>
        <span className="text-gray-400">|</span>
        <h1 className="text-2xl text-gray-800">Page Not Found</h1>
      </div>
      <p className="text-gray-600 mt-2">The page you are looking for does not exist.</p>
      <Link href="/" className="mt-4 px-4 py-2 bg-fitm-400 text-white rounded hover:bg-fitm-600 transition-colors flex items-center gap-2">
        <HomeIcon />
        Go to Home
      </Link>
    </div>
  );
}

export default NotFound;