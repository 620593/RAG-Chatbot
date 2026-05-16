"use client";

import { useState, useEffect } from "react";
import { ArrowUp, Paperclip, Workflow, Languages, Image as ImageIcon, Code2 } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import { ShimmerCard, ShimmerInput } from "@/components/Shimmer";

export default function Home() {
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [prompt, setPrompt] = useState("");

  // Simulate pinging Render backend to wake it up
  useEffect(() => {
    // In production, this would be a real fetch to your backend /health endpoint
    const timer = setTimeout(() => {
      setIsBackendReady(true);
    }, 2500); // Simulate cold start delay for demo

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-4 py-8 md:px-8">
      {/* Header Area */}
      <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full pt-10">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-semibold mb-3 text-white">Welcome to Askk AI.</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Uses multiple sources and tools to answer questions with citations
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {!isBackendReady ? (
            <>
              <ShimmerCard />
              <ShimmerCard />
              <ShimmerCard />
              <ShimmerCard />
            </>
          ) : (
            <>
              <FeatureCard 
                title="Task Automation" 
                description="Automates tasks like scheduling and reminders."
                icon={<Workflow className="w-6 h-6 text-[#6B8CFF]" />}
                gradientFrom="#0E1B3A"
                gradientTo="#1B336B"
              />
              <FeatureCard 
                title="Multi-language Support" 
                description="Communicates fluently in various languages."
                icon={<Languages className="w-6 h-6 text-[#FF9B50]" />}
                gradientFrom="#3A220E"
                gradientTo="#6B3C1B"
              />
              <FeatureCard 
                title="Image Generation" 
                description="Creates custom images based on user prompts."
                icon={<ImageIcon className="w-6 h-6 text-[#A050FF]" />}
                gradientFrom="#220E3A"
                gradientTo="#411B6B"
              />
              <FeatureCard 
                title="Code snippets" 
                description="Provides quick, functional code examples on demand."
                icon={<Code2 className="w-6 h-6 text-[#35D0BA]" />}
                gradientFrom="#0E3032"
                gradientTo="#1B5C60"
              />
            </>
          )}
        </div>
      </div>

      {/* Bottom Area (Suggestions & Input) */}
      <div className="mt-auto w-full max-w-3xl mx-auto">
        {/* Suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {["Tell me a fun fact!", "Recommend a movie to watch.", "How do I make pancakes?", "What's the latest ne..."].map((text, i) => (
            <button 
              key={i} 
              onClick={() => setPrompt(text)}
              className="px-4 py-2 rounded-full border border-[#2A2A2A] text-gray-300 text-sm hover:bg-[#222] transition-colors"
            >
              {text}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <div className="relative">
          {!isBackendReady ? (
            <ShimmerInput />
          ) : (
            <div className="relative flex items-center w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl pl-4 pr-2 py-2 focus-within:border-[#444] transition-colors">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-500 py-2"
              />
              <div className="flex items-center gap-2 ml-2">
                <button className="p-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2 rounded-full hover:bg-[#2A2A2A]">
                  <Paperclip className="w-5 h-5" />
                  <span className="text-sm hidden sm:inline">Attach content</span>
                </button>
                <button 
                  className={`p-2 rounded-full transition-colors ${prompt.length > 0 ? 'bg-white text-black' : 'bg-[#2A2A2A] text-gray-500'}`}
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          
          {/* Saved Prompts indicator */}
          <div className="absolute -bottom-8 left-4 flex items-center gap-2 text-sm text-gray-400">
            <span className="text-[#6B8CFF]">✦</span> Saved prompts
          </div>
        </div>
      </div>
    </div>
  );
}
