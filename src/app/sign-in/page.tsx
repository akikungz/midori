"use client";
import Image from "next/image";
import GoogleIcon from "@mui/icons-material/Google";

import { authClient } from "@midori/libs/auth";

import { AnimatedGridPattern } from "@midori/components/magicui/animated-grid-pattern";

export default function SignIn() {
  return (
    <div className="w-full h-full flex items-center justify-center relative p-4">
      <AnimatedGridPattern className="bg-black/10 absolute w-full h-full -z-10" />

      <div className="bg-[#8AC5E4]/80 p-8 rounded-lg shadow-lg max-w-lg w-full">
        <Image
          src="/icon.png"
          alt="Midori Logo"
          width={704}
          height={252}
          className="mx-auto mb-6 rounded-full w-2/3 h-auto"
        />

        <button
          className="w-full px-4 py-2 bg-white text-black rounded-full transition-colors flex items-center justify-between hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          onClick={() => {
            authClient.signIn.social({
              provider: "google",
              callbackURL: "http://localhost:3001",
            })
            .then(() => {
              console.log("Sign in successful!");
            })
            .catch((error) => {
              console.error("Sign in failed:", error);
            });
          }}
        >
          <GoogleIcon />
          <span className="font-semibold">Sign In with Google (@email.kmutnb.ac.th)</span>
          <div />
        </button>
      </div>
    </div>
  )
}