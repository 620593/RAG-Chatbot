import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import OfflineBanner from "@/components/OfflineBanner";
import { ChatProvider } from "@/context/ChatContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Enterprise RAG AI",
  description: "Advanced Commercial RAG Chatbot Platform — AI-powered document Q&A with offline support",
  manifest: "/manifest.json",
  themeColor: "#6B8CFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6B8CFF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Register Service Worker for offline support */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-[#0D0D0D] text-white flex flex-col h-screen overflow-hidden`}>
        <ChatProvider>
          <OfflineBanner />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-y-auto relative bg-[#0D0D0D]">
              {children}
            </main>
          </div>
        </ChatProvider>
      </body>
    </html>
  );
}
