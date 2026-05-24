"use client";

import { useState, useRef, useEffect } from "react";
import { 
  ArrowUp, 
  Paperclip, 
  X, 
  Loader2, 
  FileText, 
  Image as ImageIcon, 
  File as FileIcon, 
  Database, 
  Cpu, 
  Activity, 
  CloudLightning, 
  ArrowRight,
  Sparkles,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Search,
  BookOpen,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { useChat } from "@/context/ChatContext";

export default function Home() {
  const {
    activeTab,
    setActiveTab,
    messages,
    documents,
    isUploading,
    isLoading,
    isBackendReady,
    prompt,
    setPrompt,
    uploadDocument,
    deleteDocument,
    sendQuery
  } = useChat();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docTabFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-rose-400" />;
    if (['docx', 'doc'].includes(ext || '')) return <FileIcon className="w-5 h-5 text-blue-400" />;
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    return <FileIcon className="w-5 h-5 text-purple-400" />;
  };

  // Drag and drop handlers for Knowledge tab
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.split('.').pop()?.toLowerCase() || '';
      if (['pdf', 'docx', 'jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        await uploadDocument(droppedFile);
      }
    }
  };

  const handleDocTabFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadDocument(e.target.files[0]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() && !selectedFile) return;

    const currentPrompt = prompt;
    const currentFile = selectedFile;

    // Reset local UI states
    setPrompt("");
    setSelectedFile(null);

    // Call state context query handler
    await sendQuery(currentPrompt, currentFile);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Rich, custom, inline markdown parser
  const parseInlineMarkdown = (text: string) => {
    // Parse Bold: **text**
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((boldPart, idx) => {
      if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
        return <strong key={`b-${idx}`} className="font-bold text-white">{boldPart.slice(2, -2)}</strong>;
      }
      
      // Parse Italic: *text*
      const italicParts = boldPart.split(/(\*.*?\*)/g);
      return italicParts.map((italicPart, idx2) => {
        if (italicPart.startsWith('*') && italicPart.endsWith('*')) {
          return <em key={`i-${idx2}`} className="italic text-gray-200">{italicPart.slice(1, -1)}</em>;
        }

        // Parse Inline Code: `code`
        const codeParts = italicPart.split(/(`.*?`)/g);
        return codeParts.map((codePart, idx3) => {
          if (codePart.startsWith('`') && codePart.endsWith('`')) {
            return (
              <code 
                key={`c-${idx3}`} 
                className="bg-[#21212B] px-1.5 py-0.5 rounded text-rose-400 font-mono text-[13px] border border-[#2B2B38]"
              >
                {codePart.slice(1, -1)}
              </code>
            );
          }
          return codePart;
        });
      });
    });
  };

  const renderContentWithMarkdown = (text: string) => {
    const lines = text.split('\n');
    let insideCodeBlock = false;
    let codeBlockContent: string[] = [];

    return lines.map((line, idx) => {
      // Code Block Boundary
      if (line.trim().startsWith('```')) {
        if (insideCodeBlock) {
          insideCodeBlock = false;
          const content = codeBlockContent.join('\n');
          codeBlockContent = [];
          return (
            <pre key={`code-${idx}`} className="bg-[#15151A] border border-[#232330] rounded-xl p-4 my-3 font-mono text-sm overflow-x-auto text-emerald-400 shadow-inner">
              <code>{content}</code>
            </pre>
          );
        } else {
          insideCodeBlock = true;
          return null;
        }
      }

      if (insideCodeBlock) {
        codeBlockContent.push(line);
        return null;
      }

      // Title/Heading 1
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-2xl font-bold text-white mt-5 mb-3 tracking-tight border-b border-[#2A2A35] pb-2">{line.slice(2)}</h1>;
      }
      // Heading 2
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-xl font-bold text-[#6B8CFF] mt-4 mb-2 tracking-tight">{line.slice(3)}</h2>;
      }
      // Heading 3
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-lg font-bold text-white mt-3 mb-2">{line.slice(4)}</h3>;
      }
      // Bullet list items
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const cleanLine = line.trim().replace(/^[\*\-]\s+/, '');
        return (
          <li key={idx} className="list-disc ml-6 text-gray-300 my-1 leading-relaxed">
            {parseInlineMarkdown(cleanLine)}
          </li>
        );
      }
      // Success indicator
      if (line.startsWith('✔️ ') || line.startsWith('✅ ')) {
        return <div key={idx} className="flex items-center gap-2 text-emerald-400 font-medium my-2 bg-emerald-950/20 border border-emerald-900/30 px-3 py-1.5 rounded-lg w-fit">{parseInlineMarkdown(line)}</div>;
      }
      // Warning indicator
      if (line.startsWith('❌ ') || line.startsWith('⚠️ ')) {
        return <div key={idx} className="flex items-start gap-2 text-rose-400 font-medium my-3 bg-rose-950/15 border border-rose-900/35 px-4 py-2.5 rounded-xl">{parseInlineMarkdown(line)}</div>;
      }

      return (
        <p key={idx} className="my-2 text-gray-300 leading-relaxed min-h-[1.2rem]">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  // Mock Prompt templates library data
  const promptTemplates = [
    {
      title: "Executive Summarizer",
      category: "Summarization",
      description: "Synthesizes the primary conclusions, key statistics, and main risks from the uploaded documents.",
      icon: <FileText className="w-5 h-5 text-[#6B8CFF]" />,
      prompt: "Synthesize a comprehensive, executive-level summary of the uploaded document. Highlight the primary objectives, key metrics, critical milestones, and notable risks or considerations.",
    },
    {
      title: "Contrast & Compare Sources",
      category: "Analysis",
      description: "Identifies points of agreement, disagreement, or divergent perspectives within the uploaded literature.",
      icon: <Search className="w-5 h-5 text-[#35D0BA]" />,
      prompt: "Compare and contrast the different sections, source viewpoints, or studies mentioned in the indexed documents. What are the points of consensus, and where do they differ or contradict each other?",
    },
    {
      title: "Risk & Vulnerability Assessment",
      category: "Audit",
      description: "Searches text specifically for legal compliance vulnerabilities, fiscal bottlenecks, or operations risks.",
      icon: <AlertTriangle className="w-5 h-5 text-[#FF9B50]" />,
      prompt: "Perform a deep-dive risk analysis on the uploaded text. Identify potential legal compliance concerns, financial risks, operational bottlenecks, or security vulnerabilities discussed in the files.",
    },
    {
      title: "Key Concepts & Term Glossary",
      category: "Education",
      description: "Compiles a glossary of complex terminology, acronyms, and theoretical methodologies explained.",
      icon: <BookOpen className="w-5 h-5 text-[#A050FF]" />,
      prompt: "Extract and compile a detailed glossary of all key technical terms, specialized acronyms, and theoretical methodologies explained in the documents, along with their definitions.",
    }
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-[#0B0B0E] text-white">
      
      {/* Top Header */}
      <header className="p-4 border-b border-[#1F1F24] flex justify-between items-center bg-[#0C0C10]/95 backdrop-blur z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="md:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-[#6B8CFF] to-[#A050FF] flex items-center justify-center text-white text-xs font-bold shadow-lg">
            R
          </div>
          <div>
            <h2 className="text-md font-semibold text-white tracking-wide uppercase">
              {activeTab === "chat" && "RAG Cognitive Engine"}
              {activeTab === "knowledge" && "Knowledge Base Directory"}
              {activeTab === "prompts" && "Dynamic Template Repository"}
              {activeTab === "integrations" && "API Gateway & Integrations"}
            </h2>
            <p className="text-gray-500 text-[11px] font-mono hidden sm:block">
              {activeTab === "chat" && "ACTIVE CONVERSATION CHANNEL • LLAMA 3.3 70B"}
              {activeTab === "knowledge" && "QDRANT VECTOR ENDPOINTS INDEXER"}
              {activeTab === "prompts" && "CONTEXT-OPTIMIZED PRE-SETECTED AGENT SCRIPTS"}
              {activeTab === "integrations" && "CONNECTED CLOUD DATABASES & COMPUTE MICROSERVICES"}
            </p>
          </div>
        </div>
        
        {/* Render Health State indicator */}
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-[#16161F] border border-[#262635] px-3.5 py-1.5 rounded-full">
            <span className={`w-2 h-2 rounded-full ${isBackendReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
            <span className="font-medium tracking-wide">
              {isBackendReady ? 'RAG Gateway Connected' : 'Connecting to Render...'}
            </span>
          </span>
        </div>
      </header>

      {/* Main Tab Panels */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        
        {/* TAB 1: Chat View */}
        {activeTab === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar">
              <div className="max-w-4xl mx-auto flex flex-col gap-6">
                
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-500">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1B1B26] to-[#2B2B3D] border border-[#3A3A52] flex items-center justify-center shadow-xl">
                        <Sparkles className="w-8 h-8 text-[#6B8CFF]" />
                      </div>
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Welcome to your Cognitive RAG Assistant</h2>
                    <p className="max-w-md text-gray-400 text-sm leading-relaxed mb-8">
                      Begin by uploading your reference files (PDF, DOCX, or Images) using the attachment icon, or immediately query previously indexed files below.
                    </p>

                    {/* Pre-built suggestions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mt-4">
                      {promptTemplates.slice(0, 4).map((t, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setPrompt(t.prompt)}
                          className="p-4 rounded-xl bg-[#13131A] border border-[#22222E] hover:border-[#42425E] text-left hover:bg-[#191924] transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 mb-1.5">
                            {t.icon}
                            <h4 className="text-xs font-semibold text-white group-hover:text-[#6B8CFF] transition-colors">{t.title}</h4>
                          </div>
                          <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">{t.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div 
                        className={`max-w-[85%] md:max-w-[78%] p-5 rounded-2xl shadow-md ${
                          msg.role === "user" 
                            ? "bg-gradient-to-br from-[#1C1C26] to-[#2B2B3F] text-white rounded-br-sm border border-[#3C3C56] shadow-blue-950/10" 
                            : "bg-[#111115] border border-[#1F1F26] text-gray-200 rounded-bl-sm"
                        }`}
                      >
                        {/* Render parsed formatted message body */}
                        <div className="text-sm font-light">
                          {renderContentWithMarkdown(msg.content)}
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                          <span>{msg.role === "user" ? "USER CLIENT" : "COGNITIVE AGENT"}</span>
                          <span>{msg.timestamp}</span>
                        </div>

                        {/* Citation reference sources */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-4 pt-3.5 border-t border-[#1F1F28] text-xs">
                            <span className="font-semibold text-[#35D0BA] flex items-center gap-1.5 mb-2 font-mono tracking-wider text-[10px] uppercase">
                              <Database className="w-3.5 h-3.5" />
                              Retrieved Vector Segments
                            </span>
                            <div className="space-y-1.5">
                              {msg.sources.map((src, idx) => (
                                <div key={idx} className="flex gap-2 items-start bg-[#16161E] border border-[#21212B] p-2.5 rounded-lg text-gray-400 text-xs hover:text-gray-300">
                                  <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                                  <span className="leading-relaxed font-mono text-[11px] break-all">{src}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex justify-start animate-in fade-in duration-300">
                    <div className="max-w-[85%] md:max-w-[75%] p-5 rounded-2xl bg-[#111115] border border-[#1F1F26] text-gray-200 rounded-bl-sm flex items-center gap-3 shadow-md">
                      <Loader2 className="w-4 h-4 animate-spin text-[#6B8CFF]" />
                      <span className="text-gray-400 text-xs font-mono tracking-wider">RETRIEVING FROM VECTOR STORE & INFERRING...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Form Box Area */}
            <div className="p-4 md:p-6 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C] to-transparent pt-8 shrink-0">
              <div className="max-w-4xl mx-auto relative">
                
                {/* Selected attachment card indicator */}
                {selectedFile && (
                  <div className="absolute -top-16 left-0 flex items-center gap-3 bg-[#13131A] border border-[#2B2B3B] rounded-xl p-2.5 px-4 w-fit shadow-2xl shadow-black animate-in slide-in-from-bottom-2">
                    <div className="p-1 bg-[#1E1E26] rounded-lg">
                      {getFileIcon(selectedFile.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate max-w-[160px]">{selectedFile.name}</p>
                      <p className="text-[9px] font-mono text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <button 
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-[#2A2A38] rounded-full text-gray-400 hover:text-white transition-colors"
                      title="Clear File"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Form Input elements */}
                <form 
                  onSubmit={handleSubmit}
                  className="relative flex items-end w-full bg-[#111116] border border-[#23232F] hover:border-[#38384C] focus-within:border-[#4C4C66] rounded-2xl p-2.5 transition-all shadow-xl"
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
                    className="p-3 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-[#1B1B26] shrink-0 cursor-pointer"
                    title="Attach Knowledge File (.pdf, .docx, images)"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter prompt or query indexed documents..."
                    className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-600 p-3 min-h-[48px] max-h-[160px] resize-none text-sm leading-relaxed"
                    rows={1}
                  />

                  <button 
                    type="submit"
                    disabled={(!prompt.trim() && !selectedFile) || isUploading || isLoading}
                    className={`p-3.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                      prompt.trim() || selectedFile
                        ? 'bg-white text-black hover:bg-gray-200 font-semibold shadow-md shadow-white/10' 
                        : 'bg-[#1C1C26] text-gray-600 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUp className="w-4 h-4" />
                    )}
                  </button>
                </form>
                <div className="text-center mt-3 text-[10px] text-gray-600 font-mono tracking-wider">
                  DEPLOYED ON RENDER PLATFORM • AUTOMATIC INTEGRITY CHECKS • PERSISTENT STORAGE
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: Knowledge Vector Store Directory */}
        {activeTab === "knowledge" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-400">
              
              {/* Summary Stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#111116] border border-[#21212B] flex flex-col justify-between">
                  <span className="text-xs font-mono text-gray-500 tracking-wider">INDEXED ASSETS</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-[#35D0BA]">{documents.length}</span>
                    <span className="text-xs text-gray-400">Documents</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#111116] border border-[#21212B] flex flex-col justify-between">
                  <span className="text-xs font-mono text-gray-500 tracking-wider">AGGREGATE STORAGE</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-white">
                      {documents.length > 0
                        ? documents.reduce((acc, doc) => acc + parseFloat(doc.size || '0'), 0).toFixed(2)
                        : "0.00"}
                    </span>
                    <span className="text-xs text-gray-400">MB</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#111116] border border-[#21212B] flex flex-col justify-between">
                  <span className="text-xs font-mono text-gray-500 tracking-wider">VECTOR STORAGE</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-[#6B8CFF]">Qdrant</span>
                    <span className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/35 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold">ONLINE</span>
                  </div>
                </div>
              </div>

              {/* Drag & Drop File Indexer box */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                  dragActive 
                    ? 'border-[#6B8CFF] bg-[#101018]' 
                    : 'border-[#22222E] bg-[#111116]/40 hover:bg-[#111116]/80'
                }`}
              >
                <input 
                  type="file" 
                  ref={docTabFileInputRef} 
                  onChange={handleDocTabFileSelect}
                  className="hidden" 
                  accept=".pdf,.docx,image/*"
                />

                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-[#1D1D28] flex items-center justify-center border border-[#2C2C3C] mb-4">
                    <Database className="w-6 h-6 text-[#35D0BA]" />
                  </div>
                  <h3 className="text-md font-semibold text-white mb-1.5">Direct Document Upload Indexer</h3>
                  <p className="text-gray-400 text-xs max-w-sm mb-4 leading-relaxed">
                    Drag and drop your file here, or click to browse. Supports PDF documents, Word file (.docx), or jpeg/png images.
                  </p>
                  <button
                    onClick={() => docTabFileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-white text-black hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isUploading ? "Processing Chunk Ingestion..." : "Select Resource File"}
                  </button>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase font-mono">Knowledge Directory</h3>
                
                {documents.length === 0 ? (
                  <div className="text-center py-10 rounded-xl bg-[#111116]/20 border border-[#1E1E26] text-gray-500 text-xs italic">
                    No reference documents have been indexed yet in the persistent storage.
                  </div>
                ) : (
                  <div className="border border-[#1F1F27] rounded-xl overflow-hidden divide-y divide-[#1F1F27] bg-[#111116]/40">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-[#16161E]/40 transition-colors">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="p-2 bg-[#1A1A22] rounded-lg shrink-0 border border-[#282835]">
                            {getFileIcon(doc.name)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-white truncate max-w-[280px] md:max-w-[400px]">{doc.name}</h4>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 font-mono">
                              <span>{doc.size}</span>
                              <span>•</span>
                              <span>{doc.uploadedAt}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {doc.status === "uploading" && (
                            <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-950/20 border border-blue-900/35 px-2.5 py-1 rounded-full font-mono font-semibold text-[10px]">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              SPLITTING CHUNKS
                            </span>
                          )}
                          {doc.status === "indexed" && (
                            <span className="flex items-center gap-1 text-xs text-[#35D0BA] bg-[#183531]/40 border border-[#215E55] px-2.5 py-1 rounded-full font-mono font-semibold text-[10px]">
                              <CheckCircle className="w-3.5 h-3.5" />
                              INDEXED IN QDRANT
                            </span>
                          )}
                          {doc.status === "error" && (
                            <span className="flex items-center gap-1 text-xs text-rose-400 bg-rose-950/20 border border-rose-900/35 px-2.5 py-1 rounded-full font-mono font-semibold text-[10px]">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              FAILURE
                            </span>
                          )}

                          <button 
                            onClick={() => deleteDocument(doc.id)}
                            className="p-2 hover:bg-[#252530] text-gray-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Prompt Library Templates */}
        {activeTab === "prompts" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-400">
              
              <div className="flex flex-col gap-1.5 border-b border-[#1F1F27] pb-5">
                <h3 className="text-lg font-bold">Prompt Script Templates</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  These templates are specifically designed to optimize outputs using context retrieved from vector storage. Selecting a template will configure your prompt field instantly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {promptTemplates.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-5 rounded-xl bg-[#111116]/80 border border-[#1F1F27] hover:border-[#3E3E54] hover:bg-[#16161E] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#1A1A22] rounded-lg border border-[#2B2B3B]">
                            {item.icon}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{item.category}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed mb-4">{item.description}</p>
                    </div>

                    <button
                      onClick={() => {
                        setPrompt(item.prompt);
                        setActiveTab("chat");
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#292938] hover:border-[#47475E] text-xs font-semibold text-gray-300 hover:text-white bg-[#15151D] hover:bg-[#1E1E2B] transition-all cursor-pointer group"
                    >
                      <span>Inject into Session</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: API Integrations and statuses */}
        {activeTab === "integrations" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-400">
              
              <div className="flex flex-col gap-1.5 border-b border-[#1F1F27] pb-5">
                <h3 className="text-lg font-bold">API Integrations Configuration</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Enterprise deployment telemetry monitor. Check statuses and parameters of your active cloud pipelines.
                </p>
              </div>

              {/* Status List Cards */}
              <div className="space-y-4">
                
                {/* FastAPI backend */}
                <div className="p-4 rounded-xl bg-[#111116] border border-[#1F1F27] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-[#1B1B26] border border-[#2C2C3E] rounded-xl text-blue-400">
                      <CloudLightning className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">FastAPI Gateway App</h4>
                      <p className="text-xs text-gray-500 font-mono mt-0.5 break-all">GATEWAY PORTAL: https://rag-chatbot-api.onrender.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/35 px-2.5 py-1 rounded-full font-semibold">
                      ACTIVE DEPLOYMENT
                    </span>
                  </div>
                </div>

                {/* Qdrant DB */}
                <div className="p-4 rounded-xl bg-[#111116] border border-[#1F1F27] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-[#172522] border border-[#235850] rounded-xl text-[#35D0BA]">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">Qdrant Cloud DB Cluster</h4>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">COLLECTION IDENTIFIER: document_chunks_store</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/35 px-2.5 py-1 rounded-full font-semibold">
                      CLUSTERING ONLINE
                    </span>
                  </div>
                </div>

                {/* HuggingFace Embedding */}
                <div className="p-4 rounded-xl bg-[#111116] border border-[#1F1F27] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-[#251A1A] border border-[#522929] rounded-xl text-rose-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">HuggingFace Embeddings Pipeline</h4>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">TEXT MODEL: BAAI/bge-large-en-v1.5 (1024-dim)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/35 px-2.5 py-1 rounded-full font-semibold">
                      INFERENCE READY
                    </span>
                  </div>
                </div>

                {/* Groq Llama 3 */}
                <div className="p-4 rounded-xl bg-[#111116] border border-[#1F1F27] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-[#21172A] border border-[#4C2870] rounded-xl text-[#A050FF]">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">Groq Inference Engine</h4>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">CORE MODEL: Llama 3.3 70B (Asynchronous Graph)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/35 px-2.5 py-1 rounded-full font-semibold">
                      GRAPH EXECUTOR ONLINE
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
