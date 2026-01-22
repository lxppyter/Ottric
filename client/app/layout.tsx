/**
 * @author github.com/lxppyter
 * @license SSPL-1.0
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ottric. | The unified trust protocol.",
  description: "Generate SBOMs per release, link vulnerabilities to versions, and prove 'Not Affected' status via VEX. The unified trust protocol for modern software delivery.",
};

import SmoothScroll from "@/components/SmoothScroll";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} antialiased overflow-x-hidden`}
      >
        <SmoothScroll />
        {children}
        <Toaster />
        <footer className="w-full py-4 text-center text-sm text-muted-foreground border-t bg-background">
          Built with ❤️ by <a href="https://github.com/lxppyter" target="_blank" className="underline hover:text-primary">github.com/lxppyter</a>
        </footer>
      </body>
    </html>
  );
}
