import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    FileText, 
    Network,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    BookOpen,
    TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

import ChatMessage from "../components/chat/ChatMessage";

const LLM_MODELS = [
  { id: "gemini-pro", name: "Gemini Pro", provider: "Google" },
  { id: "gemini-flash", name: "Gemini Flash", provider: "Google" },
  { id: "gpt-4", name: "GPT-4", provider: "OpenAI" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI" },
];

export default function ChatPage() {
  const [currentSession, setCurrentSession] = useState(null);
  const [papers, setPapers] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-pro");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const queryClient = useQueryClient();

  const { data: allPapers = [] } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list("-created_date"),
    initialData: [],
  });

  useEffect(() => {
    initializeSession();
    loadPapers();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeSession = async () => {
    const newSession = await base44.entities.ChatSession.create({
      title: `Chat Session - ${format(new Date(), "MMM d, h:mm a")}`,
      messages: [],
      active: true,
      paper_ids: []
    });
    setCurrentSession(newSession);
  };

  const loadPapers = async () => {
    const completedPapers = allPapers.filter(p => p.processing_status === "completed");
    setPapers(completedPapers);
  };

  useEffect(() => {
    loadPapers();
  }, [allPapers]);

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
      const context = papers.map(paper => ({
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

  const completedPapers = papers.filter(p => p.processing_status === "completed");
  const totalNodes = completedPapers.reduce((sum, p) => sum + (p.knowledge_graph?.nodes?.length || 0), 0);
  const totalRelationships = completedPapers.reduce((sum, p) => sum + (p.knowledge_graph?.relationships?.length || 0), 0);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Left Sidebar - Knowledge Base Stats */}
      <AnimatePresence>
        {!leftCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-slate-200/60 bg-white/80 backdrop-blur-xl"
          >
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-slate-200/60">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Knowledge Base</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLeftCollapsed(true)}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-slate-600">
                  Chat with your entire research database
                </p>
              </div>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-900">{completedPapers.length}</p>
                          <p className="text-sm text-blue-700">Documents</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                          <Network className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-900">{totalNodes}</p>
                          <p className="text-sm text-purple-700">Knowledge Nodes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-emerald-900">{totalRelationships}</p>
                          <p className="text-sm text-emerald-700">Relationships</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Documents */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Documents</h3>
                    <div className="space-y-2">
                      {completedPapers.slice(0, 5).map(paper => (
                        <div key={paper.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{paper.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {paper.knowledge_graph?.nodes?.length || 0} nodes
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Left Button */}
      {leftCollapsed && (
        <div className="flex items-center border-r border-slate-200/60 bg-white/80">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLeftCollapsed(false)}
            className="m-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Main Content - Empty State */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Chat with Your Research</h2>
          <p className="text-slate-600 mb-6">
            Ask questions about your {completedPapers.length} documents and get AI-powered answers with citations from your knowledge base.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Sparkles className="w-4 h-4" />
            <span>Powered by {LLM_MODELS.find(m => m.id === selectedModel)?.name}</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Chat Interface */}
      <AnimatePresence>
        {!rightCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 480, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-slate-200/60 bg-white/80 backdrop-blur-xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200/60">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">AI Assistant</h2>
                    <p className="text-xs text-slate-500">
                      {currentSession?.messages?.length || 0} messages
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightCollapsed(true)}
                  className="h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Model Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">AI Model</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LLM_MODELS.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3 h-3" />
                          <span>{model.name}</span>
                          <Badge variant="outline" className="text-xs ml-1">
                            {model.provider}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {currentSession?.messages?.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-2">Start a conversation</p>
                    <p className="text-sm text-slate-400">Ask anything about your research documents</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {currentSession?.messages?.map((msg, index) => (
                      <ChatMessage
                        key={msg.id}
                        message={msg}
                        index={index}
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
                    <div className="flex items-center gap-2 text-slate-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing documents...</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-slate-200/60 p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your research..."
                  className="flex-1 bg-white/70"
                  disabled={isLoading || completedPapers.length === 0}
                />
                <Button 
                  type="submit" 
                  disabled={!message.trim() || isLoading || completedPapers.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              {completedPapers.length === 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  Upload and process documents to start chatting
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Right Button */}
      {rightCollapsed && (
        <div className="flex items-center border-l border-slate-200/60 bg-white/80">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightCollapsed(false)}
            className="m-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}