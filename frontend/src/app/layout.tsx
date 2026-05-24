import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ChatProvider } from "@/context/ChatContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Enterprise RAG AI",
  description: "Advanced Commercial RAG Chatbot Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0D0D0D] text-white flex h-screen overflow-hidden`}>
        <ChatProvider>
          <Sidebar />
          <main className="flex-1 flex flex-col h-screen overflow-y-auto relative bg-[#0D0D0D]">
            {children}
          </main>
        </ChatProvider>
      </body>
    </html>
  );
}
