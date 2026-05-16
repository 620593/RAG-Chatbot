"use client";

import { Home, MessageSquare, Library, LayoutGrid, Plus, Pin, History } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-[260px] h-screen bg-[#111111] border-r border-[#222222] flex flex-col hidden md:flex flex-shrink-0">
      {/* Top Section */}
      <div className="p-3">
        <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#222222] transition-colors text-white font-medium">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
              G
            </div>
            <span>ChatGPT-4</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21L16.65 16.65"></path>
          </svg>
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-[#1A1A1A] text-white text-sm rounded-lg pl-9 pr-3 py-2 border border-[#2A2A2A] focus:outline-none focus:border-[#444]"
          />
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-6 text-sm">
        <div className="space-y-0.5">
          <Link href="/" className="flex items-center gap-3 px-2 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#222222] transition-colors">
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-2 py-2 rounded-lg text-white bg-[#222222] transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-2 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#222222] transition-colors">
            <Library className="w-4 h-4" />
            <span>Prompt Library</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-2 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#222222] transition-colors">
            <LayoutGrid className="w-4 h-4" />
            <span>Integrations</span>
          </Link>
        </div>

        {/* Pinned */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 px-2 mb-2">
            <span>Pinned</span>
            <button className="hover:text-gray-300"><Plus className="w-3 h-3" /></button>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#222222] transition-colors cursor-pointer truncate">
              <span className="text-gray-500">⚛</span>
              <span className="truncate">Healthy Habits Inspiration</span>
            </div>
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#222222] transition-colors cursor-pointer truncate">
              <span className="text-red-400">☀</span>
              <span className="truncate">Paris, The City of Lights</span>
            </div>
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#222222] transition-colors cursor-pointer truncate">
              <span className="text-gray-500">🌐</span>
              <span className="truncate">Productivity Hacks Unlocked</span>
            </div>
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#222222] transition-colors cursor-pointer truncate">
              <span className="text-blue-400">✦</span>
              <span className="truncate">Quantum Physics Simplified</span>
            </div>
            <button className="text-gray-400 hover:text-gray-300 px-2 py-2 text-xs flex items-center gap-2">
              <Plus className="w-3 h-3" /> Show 4 more
            </button>
          </div>
        </div>

        {/* Today */}
        <div>
          <div className="text-xs font-semibold text-gray-500 px-2 mb-2">Today</div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#222222] transition-colors cursor-pointer truncate">
              <History className="w-4 h-4 text-gray-500" />
              <span className="truncate">Your Custom Poem</span>
            </div>
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#222222] transition-colors cursor-pointer truncate">
              <History className="w-4 h-4 text-gray-500" />
              <span className="truncate">Investment Tips from Yesterday</span>
            </div>
          </div>
        </div>
      </nav>
      
      {/* User profile bottom (optional, matching image layout) */}
      <div className="p-3 border-t border-[#222222]">
          {/* Bottom user section if needed */}
      </div>
    </aside>
  );
}
