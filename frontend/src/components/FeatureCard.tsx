"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  gradientFrom: string;
  gradientTo: string;
}

export default function FeatureCard({ title, description, icon, gradientFrom, gradientTo }: FeatureCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl p-5 border border-white/5 cursor-pointer group`}
    >
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 opacity-80 transition-opacity group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`
        }}
      />
      
      {/* Inner Content overlay for darker feel */}
      <div className="absolute inset-0 bg-[#0F0F12]/40" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="mb-8">
          {icon}
        </div>
        <div>
          <h3 className="text-white font-medium mb-1">{title}</h3>
          <p className="text-gray-300 text-sm">{description}</p>
        </div>
      </div>

      {/* Sparkles (Optional, can be CSS or SVG) */}
      <div className="absolute top-4 right-4 opacity-50">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" fill="currentColor" className="text-white"/>
          <path d="M19.5 5.5L20.25 7.75L22.5 8.5L20.25 9.25L19.5 11.5L18.75 9.25L16.5 8.5L18.75 7.75L19.5 5.5Z" fill="currentColor" className="text-white"/>
        </svg>
      </div>
    </motion.div>
  );
}
