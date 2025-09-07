import React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AchievementProvider } from "@/components/achievement-provider";
import { AuthProvider } from "@/components/auth-provider";
import { GuestProvider } from "@/contexts/guest-context";


export const metadata: Metadata = {
  title: "Spark - Visual Idea Evolution Platform",
  description: "Nurture concepts from initial inspiration to completion with gamified, visual interaction and AI integration.",
  keywords: ["Spark", "ideas", "visual", "gamification", "AI", "development", "creativity"],
  authors: [{ name: "Spark Team" }],
  openGraph: {
    title: "Spark - Visual Idea Evolution Platform",
    description: "Nurture concepts from initial inspiration to completion with gamified, visual interaction",
    url: "https://spark.z.ai",
    siteName: "Spark",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spark - Visual Idea Evolution Platform",
    description: "Nurture concepts from initial inspiration to completion with gamified, visual interaction",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-background text-foreground`}
      >
        <GuestProvider children={
          <AuthProvider children={
            <AchievementProvider children={
              <>
                {children}
                <Toaster />
              </>
            } />
          } />
        } />
      </body>
    </html>
  );
}
