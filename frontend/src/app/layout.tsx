import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Askk AI",
  description: "Welcome to Askk AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0D0D0D] text-white flex h-screen overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
          {children}
        </main>
      </body>
    </html>
  );
}
