
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    MessageSquare,
    Send,
    Bot,
    User,
    Loader2,
    X,
    Sparkles,
    Minimize2,
    Move,
    Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

import ChatMessage from "./ChatMessage";

const LLM_MODELS = [
  { id: "gemini-pro", name: "Gemini Pro", provider: "Google" },
  { id: "gemini-flash", name: "Gemini Flash", provider: "Google" },
  { id: "gpt-4", name: "GPT-4", provider: "OpenAI" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI" },
];

export default function ChatWidget({ isOpen, onClose, darkMode = false }) {
  const [currentSession, setCurrentSession] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-pro");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Initialized to 0,0, will be set by useEffect
  const [size, setSize] = useState({ width: 400, height: 600 }); // Initialized to desktop default, will be set by useEffect
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const widgetRef = useRef(null);

  const { data: papers = [] } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list("-created_date"),
    initialData: [],
  });

  const completedPapers = papers.filter(p => p.processing_status === "completed");

  useEffect(() => {
    if (isOpen && !currentSession) {
      initializeSession();
    }
  }, [isOpen, currentSession]); // Added currentSession to dependencies to prevent unnecessary re-initialization

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (mobile) {
        // Full screen on mobile
        setPosition({ x: 0, y: 0 });
        setSize({ width: window.innerWidth, height: window.innerHeight });
      } else {
        // Positioned widget on desktop
        setPosition({ x: window.innerWidth - 430, y: window.innerHeight - 700 });
        setSize({ width: 400, height: 600 });
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []); // Empty dependency array means this effect runs once on mount and sets up resize listener.

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
      if (isResizing) {
        const newWidth = Math.max(350, e.clientX - position.x);
        const newHeight = Math.max(400, e.clientY - position.y);
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, position]);

  const handleDragStart = (e) => {
    if (isMobile) return; // No dragging on mobile
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleResizeStart = (e) => {
    if (isMobile) return; // No resizing on mobile
    e.stopPropagation();
    setIsResizing(true);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeSession = async () => {
    const greetingMessage = {
      id: "greeting-" + Date.now(),
      role: "assistant",
      content: "Hi! 👋 I'm your AI research assistant. You can ask me anything about your uploaded documents. I'll provide detailed answers with citations from your knowledge base. What would you like to know?",
      timestamp: new Date().toISOString(),
      citations: []
    };

    const newSession = await base44.entities.ChatSession.create({
      title: `Chat Session - ${format(new Date(), "MMM d, h:mm a")}`,
      messages: [greetingMessage],
      active: true,
      paper_ids: []
    });
    setCurrentSession(newSession);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !currentSession) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
      citations: []
    };

    const updatedMessages = [...currentSession.messages, userMessage];
    await base44.entities.ChatSession.update(currentSession.id, {
      messages: updatedMessages
    });
    setCurrentSession(prev => ({ ...prev, messages: updatedMessages }));

    setMessage("");
    setIsLoading(true);

    try {
      const context = completedPapers.map(paper => ({
        id: paper.id,
        title: paper.title,
        content: paper.extracted_content?.full_text || "",
        pages: paper.extracted_content?.pages || [],
        file_url: paper.file_url
      }));

      const contextText = context.map(p =>
        `Document: ${p.title}\nContent: ${p.content.substring(0, 2000)}...`
      ).join("\n\n");

      const prompt = `
You are a research assistant with access to uploaded documents. Answer the user's question based on the provided context.

Context from uploaded documents:
${contextText}

User question: ${message}

Instructions:
1. Provide a comprehensive answer based on the documents
2. Include inline citations in the format [Citation X] where X is a number
3. For each citation, provide the source document title, relevant text snippet, and page number if available
4. Be precise and reference specific information from the documents

Format your response as JSON with this structure:
{
  "answer": "Your detailed answer with [Citation 1], [Citation 2] etc.",
  "citations": [
    {
      "id": "1",
      "paper_id": "document_id",
      "paper_title": "Document Title",
      "text_snippet": "Relevant text from document",
      "page": 1,
      "confidence": 0.9,
      "file_url": "document_url"
    }
  ]
}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            answer: { type: "string" },
            citations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  paper_id: { type: "string" },
                  paper_title: { type: "string" },
                  text_snippet: { type: "string" },
                  page: { type: "number" },
                  confidence: { type: "number" },
                  file_url: { type: "string" }
                }
              }
            }
          }
        }
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        timestamp: new Date().toISOString(),
        citations: response.citations || []
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      await base44.entities.ChatSession.update(currentSession.id, {
        messages: finalMessages
      });
      setCurrentSession(prev => ({ ...prev, messages: finalMessages }));

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date().toISOString(),
        citations: []
      };

      const finalMessages = [...updatedMessages, errorMessage];
      await base44.entities.ChatSession.update(currentSession.id, {
        messages: finalMessages
      });
      setCurrentSession(prev => ({ ...prev, messages: finalMessages }));
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={widgetRef}
          initial={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            position: 'fixed',
            left: isMobile ? 0 : `${position.x}px`,
            top: isMobile ? 0 : `${position.y}px`,
            width: isMobile ? '100%' : `${size.width}px`,
            height: isMobile ? '100%' : (isMinimized ? 'auto' : `${size.height}px`),
            cursor: isDragging ? 'grabbing' : 'default',
            zIndex: 50
          }}
          className={`${darkMode ? 'bg-slate-900' : 'bg-white'} ${isMobile ? '' : 'rounded-2xl'} shadow-2xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex flex-col overflow-hidden`}
        >
          {/* Header - Draggable on desktop only */}
          <div
            onMouseDown={handleDragStart}
            className={`p-4 border-b ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'} flex items-center justify-between ${isMobile ? 'cursor-default' : 'cursor-move'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>AI Assistant</h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {completedPapers.length} documents
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4" style={{ height: isMobile ? 'calc(100vh - 180px)' : `${size.height - 180}px` }}>
                <div className="space-y-4">
                  {!currentSession || currentSession.messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                      <p className={`mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading...</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {currentSession.messages.map((msg, index) => (
                        <ChatMessage
                          key={msg.id}
                          message={msg}
                          index={index}
                          darkMode={darkMode}
                        />
                      ))}
                    </AnimatePresence>
                  )}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className={`flex items-center gap-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing...</span>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className={`border-t ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'} p-3 md:p-4`}>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about your research..."
                    className={`flex-1 ${darkMode ? 'bg-slate-700 text-white placeholder:text-slate-400 border-slate-600' : ''}`}
                    disabled={isLoading || completedPapers.length === 0}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!message.trim() || isLoading || completedPapers.length === 0}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
                {completedPapers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2">
                    Upload documents to start chatting
                  </p>
                )}
              </div>

              {/* Resize Handle - Desktop Only */}
              {!isMobile && (
                <div
                  onMouseDown={handleResizeStart}
                  className={`absolute bottom-0 right-0 w-4 h-4 cursor-se-resize ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                  style={{
                    clipPath: 'polygon(100% 0, 100% 100%, 0 100%)'
                  }}
                />
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
