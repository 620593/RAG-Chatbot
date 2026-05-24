"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
  sources?: string[];
};

export type DocumentItem = {
  id: string;
  name: string;
  size: string;
  type: string;
  status: "uploading" | "indexed" | "error";
  uploadedAt: string;
  error?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
};

type ChatContextType = {
  activeTab: "chat" | "knowledge" | "prompts" | "integrations";
  setActiveTab: (tab: "chat" | "knowledge" | "prompts" | "integrations") => void;
  chats: ChatSession[];
  currentChatId: string;
  messages: Message[];
  documents: DocumentItem[];
  isUploading: boolean;
  isLoading: boolean;
  isBackendReady: boolean;
  prompt: string;
  setPrompt: (prompt: string) => void;
  startNewChat: () => void;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => void;
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (id: string) => void;
  sendQuery: (text: string, fileToUpload?: File | null) => Promise<void>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://rag-chatbot-api.onrender.com";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<"chat" | "knowledge" | "prompts" | "integrations">("chat");
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [prompt, setPrompt] = useState("");

  // Persist chat history and documents in localstorage for a commercial, robust feel
  useEffect(() => {
    const savedChats = localStorage.getItem("rag_chats");
    const savedDocs = localStorage.getItem("rag_docs");
    
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      if (parsedChats.length > 0) {
        setCurrentChatId(parsedChats[0].id);
      } else {
        const newId = Date.now().toString();
        const initialChat: ChatSession = {
          id: newId,
          title: "New Chat",
          messages: [],
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChats([initialChat]);
        setCurrentChatId(newId);
      }
    } else {
      const newId = Date.now().toString();
      const initialChat: ChatSession = {
        id: newId,
        title: "Welcome to RAG Chat",
        messages: [
          {
            id: "welcome",
            role: "ai",
            content: "Hello! I am your advanced RAG (Retrieval-Augmented Generation) assistant. Upload any PDFs, Word documents (.docx), or images, and I will index them dynamically to answer your questions with precise source citations.\n\nHow can I help you today?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ],
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChats([initialChat]);
      setCurrentChatId(newId);
    }

    if (savedDocs) {
      setDocuments(JSON.parse(savedDocs));
    }

    // Ping backend to wake it up and set ready state
    const pingBackend = async () => {
      try {
        const res = await fetch(`${API_URL.replace(/\/$/, "")}/`);
        if (res.ok || res.status === 404 || res.status === 307 || res.status === 302) {
          setIsBackendReady(true);
        }
      } catch (e) {
        console.error("Backend not reachable, but setting ready for offline mock capability:", e);
        // We set ready anyway so client is not permanently locked in shimmer
        setIsBackendReady(true);
      }
    };
    pingBackend();
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("rag_chats", JSON.stringify(chats));
    }
  }, [chats]);

  // Save documents to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("rag_docs", JSON.stringify(documents));
  }, [documents]);

  const currentChat = chats.find(c => c.id === currentChatId);
  const messages = currentChat ? currentChat.messages : [];

  const startNewChat = () => {
    const newId = Date.now().toString();
    const newChat: ChatSession = {
      id: newId,
      title: "New Chat",
      messages: [
        {
          id: "welcome-" + newId,
          role: "ai",
          content: "Starting a new session. Please upload a document or type your prompt.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newId);
    setActiveTab("chat");
  };

  const selectChat = (id: string) => {
    setCurrentChatId(id);
    setActiveTab("chat");
  };

  const deleteChat = (id: string) => {
    const remainingChats = chats.filter(c => c.id !== id);
    setChats(remainingChats);
    if (currentChatId === id) {
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        const newId = Date.now().toString();
        const initialChat: ChatSession = {
          id: newId,
          title: "New Chat",
          messages: [],
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChats([initialChat]);
        setCurrentChatId(newId);
      }
    }
  };

  const uploadDocument = async (file: File) => {
    const docId = Date.now().toString();
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    const newDoc: DocumentItem = {
      id: docId,
      name: file.name,
      size: sizeMB,
      type: file.name.split('.').pop() || "unknown",
      status: "uploading",
      uploadedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
    };

    setDocuments(prev => [newDoc, ...prev]);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Indexing failed");
      }

      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: "indexed" } : d));
    } catch (e: any) {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: "error", error: e.message } : d));
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const sendQuery = async (text: string, fileToUpload?: File | null) => {
    if (!text.trim() && !fileToUpload) return;
    
    let targetChatId = currentChatId;
    if (!targetChatId) {
      targetChatId = Date.now().toString();
      const newChat: ChatSession = {
        id: targetChatId,
        title: text.slice(0, 30) || "New Chat",
        messages: [],
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(targetChatId);
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Handle file upload if present
    if (fileToUpload) {
      await uploadDocument(fileToUpload);
    }

    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp
    };

    setChats(prev => prev.map(c => {
      if (c.id === targetChatId) {
        const updatedMsgs = [...c.messages, userMsg];
        const newTitle = c.title === "New Chat" || c.title === "Welcome to RAG Chat" ? text.slice(0, 30) + (text.length > 30 ? "..." : "") : c.title;
        return {
          ...c,
          title: newTitle,
          messages: updatedMsgs
        };
      }
      return c;
    }));

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question: text })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Unable to retrieve response from RAG agent");
      }

      const data = await res.json();
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources || []
      };

      setChats(prev => prev.map(c => {
        if (c.id === targetChatId) {
          return {
            ...c,
            messages: [...c.messages, aiMsg]
          };
        }
        return c;
      }));

    } catch (e: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: `### ❌ Request Failed\n\n${e.message}\n\n*Please ensure that you have uploaded at least one document to the vector store before querying the chatbot, as the RAG pipeline depends on having vector index embeddings to search.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChats(prev => prev.map(c => {
        if (c.id === targetChatId) {
          return {
            ...c,
            messages: [...c.messages, errorMsg]
          };
        }
        return c;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        activeTab,
        setActiveTab,
        chats,
        currentChatId,
        messages,
        documents,
        isUploading,
        isLoading,
        isBackendReady,
        prompt,
        setPrompt,
        startNewChat,
        selectChat,
        deleteChat,
        uploadDocument,
        deleteDocument,
        sendQuery
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
