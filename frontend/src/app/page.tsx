"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Paperclip, X, Loader2, FileText, Image as ImageIcon, File as FileIcon } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  sources?: string[];
};

// Replace with your actual Render URL in production or configure via environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://rag-chatbot-api.onrender.com";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes("image")) return <ImageIcon className="w-4 h-4" />;
    if (file.type.includes("pdf")) return <FileText className="w-4 h-4" />;
    return <FileIcon className="w-4 h-4" />;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() && !selectedFile) return;

    let currentPrompt = prompt;
    const currentFile = selectedFile;

    // Reset input states
    setPrompt("");
    setSelectedFile(null);

    // If there is a file, we need to upload it first
    if (currentFile) {
      setIsUploading(true);
      
      // Add a temporary system message about uploading
      const uploadMsgId = Date.now().toString();
      setMessages(prev => [...prev, { id: uploadMsgId, role: "user", content: `[Uploading file: ${currentFile.name}...]` }]);

      const formData = new FormData();
      formData.append("file", currentFile);

      try {
        const uploadRes = await fetch(`${API_URL}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.detail || "Failed to upload file");
        }

        // Update the upload message to success
        setMessages(prev => prev.map(msg => 
          msg.id === uploadMsgId 
            ? { ...msg, content: `[Successfully uploaded and indexed: ${currentFile.name}]` }
            : msg
        ));
      } catch (error: any) {
        setMessages(prev => prev.map(msg => 
          msg.id === uploadMsgId 
            ? { ...msg, content: `[Failed to upload ${currentFile.name}: ${error.message}]` }
            : msg
        ));
        setIsUploading(false);
        return; // Stop if upload fails and we don't want to proceed without context
      } finally {
        setIsUploading(false);
      }
    }

    // If there's also a prompt or just a prompt without a file, send to /chat
    if (currentPrompt.trim()) {
      setIsLoading(true);
      const userMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: userMsgId, role: "user", content: currentPrompt }]);

      try {
        const chatRes = await fetch(`${API_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: currentPrompt }),
        });

        if (!chatRes.ok) {
          const errorData = await chatRes.json();
          throw new Error(errorData.detail || "Failed to get response");
        }

        const chatData = await chatRes.json();
        
        setMessages(prev => [...prev, { 
          id: (Date.now() + 2).toString(), 
          role: "ai", 
          content: chatData.answer,
          sources: chatData.sources
        }]);

      } catch (error: any) {
        setMessages(prev => [...prev, { 
          id: (Date.now() + 2).toString(), 
          role: "ai", 
          content: `Error: ${error.message}` 
        }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0F0F12] text-white font-sans">
      {/* Header */}
      <header className="p-4 border-b border-[#2A2A2A] flex justify-between items-center bg-[#0F0F12] z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6B8CFF] to-[#A050FF] flex items-center justify-center font-bold shadow-lg shadow-purple-500/20">
            R
          </div>
          <h1 className="text-xl font-semibold tracking-tight">RAG Chatbot</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#1A1A1A] px-3 py-1.5 rounded-full border border-[#2A2A2A]">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          Render Connected
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-80 animate-in fade-in duration-700">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#1A1A1A] to-[#2A2A2A] border border-[#3A3A3A] flex items-center justify-center mb-8 shadow-2xl shadow-black/50">
                <FileText className="w-10 h-10 text-[#6B8CFF]" />
              </div>
              <h2 className="text-3xl font-semibold mb-3 tracking-tight">Welcome to your RAG Assistant</h2>
              <p className="max-w-md text-gray-400 text-lg leading-relaxed">
                Upload PDFs, DOCX files, or images to index them, then ask questions about their content.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
                <div 
                  className={`max-w-[85%] md:max-w-[75%] p-5 rounded-3xl shadow-lg ${
                    msg.role === "user" 
                      ? "bg-gradient-to-br from-[#2A2A2A] to-[#333] text-white rounded-br-sm border border-[#444]" 
                      : "bg-[#1A1A1A] border border-[#2A2A2A] text-gray-200 rounded-bl-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  
                  {/* Sources display */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#333] text-sm text-gray-400">
                      <p className="font-medium mb-2 text-gray-300 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Sources
                      </p>
                      <ul className="list-disc pl-5 space-y-1.5">
                        {msg.sources.map((source, idx) => (
                          <li key={idx} className="truncate hover:text-gray-300 transition-colors cursor-default">{source}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="max-w-[85%] md:max-w-[75%] p-5 rounded-3xl bg-[#1A1A1A] border border-[#2A2A2A] text-gray-200 rounded-bl-sm flex items-center gap-3 shadow-lg">
                <Loader2 className="w-5 h-5 animate-spin text-[#6B8CFF]" />
                <span className="text-gray-400 font-medium tracking-wide">Processing query...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-[#0F0F12] via-[#0F0F12] to-transparent pt-10">
        <div className="max-w-4xl mx-auto relative">
          {/* Selected File Chip */}
          {selectedFile && (
            <div className="absolute -top-14 left-0 mb-3 flex items-center gap-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-2.5 px-4 w-fit shadow-xl animate-in slide-in-from-bottom-2">
              <div className="p-1.5 bg-[#2A2A2A] rounded-lg">
                {getFileIcon(selectedFile)}
              </div>
              <span className="text-sm font-medium text-gray-200 truncate max-w-[200px]">{selectedFile.name}</span>
              <button 
                onClick={() => setSelectedFile(null)}
                className="p-1 hover:bg-[#333] rounded-full text-gray-400 hover:text-white transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Box */}
          <form 
            onSubmit={handleSubmit}
            className="relative flex items-end w-full bg-[#1A1A1A] border border-[#333] rounded-3xl p-2.5 focus-within:border-[#555] transition-all shadow-2xl shadow-black/50"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect}
              className="hidden" 
              accept=".pdf,.docx,image/*"
            />
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 text-gray-400 hover:text-white transition-colors rounded-2xl hover:bg-[#2A2A2A] shrink-0"
              title="Attach File"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or upload a document..."
              className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-500 p-3.5 min-h-[52px] max-h-[200px] resize-none text-base"
              rows={1}
            />

            <button 
              type="submit"
              disabled={(!prompt.trim() && !selectedFile) || isUploading || isLoading}
              className={`p-3.5 rounded-2xl transition-all shrink-0 ${
                prompt.trim() || selectedFile
                  ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                  : 'bg-[#2A2A2A] text-gray-500'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ml-2`}
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5" />
              )}
            </button>
          </form>
          <div className="text-center mt-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Powered by RAG Backend deployed on Render
          </div>
        </div>
      </div>
    </div>
  );
}
