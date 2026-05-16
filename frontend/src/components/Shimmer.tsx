"use client";

import { motion } from "framer-motion";

export function ShimmerCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#1A1A1A] h-32 w-full p-5 border border-[#2A2A2A]">
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{
          translateX: ["-100%", "100%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
      />
      <div className="w-8 h-8 rounded-full bg-[#2A2A2A] mb-4"></div>
      <div className="h-4 w-3/4 bg-[#2A2A2A] rounded mb-2"></div>
      <div className="h-3 w-1/2 bg-[#2A2A2A] rounded"></div>
    </div>
  );
}

export function ShimmerInput() {
  return (
    <div className="relative overflow-hidden rounded-full bg-[#1A1A1A] h-14 w-full border border-[#2A2A2A]">
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{
          translateX: ["-100%", "100%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
      />
    </div>
  );
}
