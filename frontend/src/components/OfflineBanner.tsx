"use client";

import { useChat } from "@/context/ChatContext";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const { isOffline } = useChat();

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center justify-center gap-2.5 bg-amber-950/90 border-b border-amber-700/60 text-amber-300 text-xs font-medium py-2.5 px-4 w-full backdrop-blur z-50 shrink-0 animate-in slide-in-from-top-2 duration-300"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-400" />
      <span>
        <span className="font-bold text-amber-200">You are offline.</span>{" "}
        Chat history and cached documents are available. AI queries require an internet connection.
      </span>
    </div>
  );
}
