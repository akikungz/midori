"use client";
import Image from "next/image";
import Link from "next/link";

import { authClient } from "@midori/libs/auth";
import { env } from "@midori/libs/env";

import { AnimatedGridPattern } from "@midori/components/magicui/animated-grid-pattern";
import { cn } from "@midori/utils/format";

export default function SignIn() {
  const handleSignIn = () => {
    authClient.signIn.social({
      provider: "google",
      callbackURL: env.FRONTEND_BASE_URL,
    });
  }

  return (
    <div className="w-full h-full flex items-center justify-center relative p-4">
      <AnimatedGridPattern className="bg-black/10 absolute w-full h-full -z-10" />

      <div className="bg-fitm-200/80 p-8 rounded-lg shadow-lg max-w-lg w-full">
        <Image
          src="/icon.png"
          alt="Midori Logo"
          width={704}
          height={252}
          className="mx-auto mb-6 rounded-full w-2/3 h-auto"
        />

        <button
          className={
            cn(
              "w-full px-4 py-2 bg-white text-black border-2 border-white transition-all",
              "flex items-center justify-between rounded-full cursor-pointer",
              "hover:border-kmutnb-500 focus:outline-none focus:ring-2 focus:ring-kmutnb-500"
            )
          }
          onClick={handleSignIn}
        >
          {/* <GoogleIcon /> */}
          <Image
            src="/google_logo.svg"
            alt="Google Icon"
            width={24}
            height={24}
            className="mr-2"
          />
          <span className="font-semibold">Sign In with Google (@email.kmutnb.ac.th)</span>
          <div />
        </button>

        <span className="block text-center text-sm mt-4 text-gray-600">
          การเข้าใช้งานแพลตฟอร์มของคณะมี <Link href="/terms" className="underline text-fitm-500">Terms of Service</Link> ที่คุณจำเป็นต้องรู้
        </span>
      </div>
    </div>
  )
}