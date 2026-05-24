"use client";

import { Home, MessageSquare, Library, LayoutGrid, Plus, Pin, History, Trash2, Database, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { useChat } from "@/context/ChatContext";

export default function Sidebar() {
  const {
    activeTab,
    setActiveTab,
    chats,
    currentChatId,
    selectChat,
    deleteChat,
    startNewChat,
    documents
  } = useChat();

  return (
    <aside className="w-[280px] h-screen bg-[#0F0F12] border-r border-[#1F1F24] flex flex-col hidden md:flex flex-shrink-0 z-20">
      {/* Brand & New Chat Button */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6B8CFF] to-[#A050FF] flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/10">
              R
            </div>
            <span className="text-white font-semibold tracking-wide text-md">Enterprise RAG</span>
          </div>
        </div>

        <button 
          onClick={startNewChat}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#1A1A22] border border-[#2B2B37] hover:border-[#4B4B67] text-white hover:bg-[#20202B] transition-all text-sm font-medium shadow-sm hover:shadow-md cursor-pointer group"
        >
          <Plus className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          <span>New Session</span>
        </button>
      </div>

      {/* Main Nav tabs */}
      <nav className="px-3 space-y-1.5 text-sm">
        <button
          onClick={() => setActiveTab("chat")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "chat"
              ? "text-white bg-[#1C1C24] border border-[#2B2B3A]"
              : "text-gray-400 hover:text-white hover:bg-[#13131A]"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-[#6B8CFF]" />
          <span className="font-medium">Active Agent Chat</span>
        </button>

        <button
          onClick={() => setActiveTab("knowledge")}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "knowledge"
              ? "text-white bg-[#1C1C24] border border-[#2B2B3A]"
              : "text-gray-400 hover:text-white hover:bg-[#13131A]"
          }`}
        >
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-[#35D0BA]" />
            <span className="font-medium">Vector Store</span>
          </div>
          {documents.length > 0 && (
            <span className="bg-[#1C3B3B] text-[#35D0BA] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#235C57]">
              {documents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("prompts")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "prompts"
              ? "text-white bg-[#1C1C24] border border-[#2B2B3A]"
              : "text-gray-400 hover:text-white hover:bg-[#13131A]"
          }`}
        >
          <Library className="w-4 h-4 text-[#FF9B50]" />
          <span className="font-medium">Prompt Templates</span>
        </button>

        <button
          onClick={() => setActiveTab("integrations")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "integrations"
              ? "text-white bg-[#1C1C24] border border-[#2B2B3A]"
              : "text-gray-400 hover:text-white hover:bg-[#13131A]"
          }`}
        >
          <LayoutGrid className="w-4 h-4 text-[#A050FF]" />
          <span className="font-medium">API Integrations</span>
        </button>
      </nav>

      {/* Divider */}
      <div className="px-6 my-4 border-t border-[#1F1F24]" />

      {/* Scrollable list of chat sessions */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-4 text-sm">
        {/* Active Chats */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 px-3 mb-2 tracking-wider uppercase">
            <span>Conversations</span>
          </div>
          <div className="space-y-1">
            {chats.length === 0 ? (
              <div className="text-xs text-gray-600 px-3 py-2 italic">
                No active sessions
              </div>
            ) : (
              chats.map((c) => {
                const isActive = c.id === currentChatId;
                return (
                  <div
                    key={c.id}
                    onClick={() => selectChat(c.id)}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#181820] text-white border border-[#282836]"
                        : "text-gray-400 hover:text-white hover:bg-[#121218]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <History className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      <span className="truncate text-xs font-medium">{c.title || "New Chat"}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(c.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 rounded transition-opacity"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Uploaded Documents Quickview */}
        {documents.length > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 px-3 mb-2 tracking-wider uppercase">
              <span>Knowledge Base</span>
            </div>
            <div className="space-y-1 max-h-[160px] overflow-y-auto custom-scrollbar">
              {documents.slice(0, 4).map((doc) => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-[#121218] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="w-3.5 h-3.5 text-[#35D0BA] flex-shrink-0" />
                    <span className="truncate text-xs">{doc.name}</span>
                  </div>
                  {doc.status === "indexed" ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  ) : doc.status === "uploading" ? (
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-rose-400 flex-shrink-0" />
                  )}
                </div>
              ))}
              {documents.length > 4 && (
                <button
                  onClick={() => setActiveTab("knowledge")}
                  className="text-xs text-gray-500 hover:text-white px-3 py-1 block text-left"
                >
                  + {documents.length - 4} more files
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Profile Section */}
      <div className="p-4 border-t border-[#1F1F24] bg-[#0A0A0D]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF9B50] to-[#FF5F6D] flex items-center justify-center font-bold text-white text-sm shadow-md">
            U
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-white text-xs font-medium truncate">Commercial Sandbox</h4>
            <p className="text-gray-500 text-[10px] truncate">Admin Level Access</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
