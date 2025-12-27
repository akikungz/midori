import type { Metadata } from "next";
import '@midori/styles/globals.css';

import { Geist, Geist_Mono } from 'next/font/google';

import { QueryProvider } from '@midori/components/QueryProvider';
import { ThemeProvider } from '@midori/components/ThemeProvider';
import { cn } from '@midori/lib/utils';

import type { PropsWithChildren } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FITM Cloud",
  description:
    "FITM Cloud Platform for Students and Educators in IT Department, Faculty of Industry Technology and Management, King Mongkut's University of Technology North Bangkok.",
};

export default function RootLayout({ children }: Readonly<PropsWithChildren>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(geistSans.variable, geistMono.variable, "antialiased")}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
