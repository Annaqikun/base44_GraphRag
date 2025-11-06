
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/lib/utils";
import { 
    Brain, 
    Upload, 
    LayoutDashboard, 
    Network, 
    MessageSquare,
    BookOpen,
    Lightbulb,
    AlertTriangle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Moon,
    Sun,
    Menu
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

import ChatWidget from "./components/chat/ChatWidget";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Upload Paper",
    url: createPageUrl("Upload"),
    icon: Upload,
  },
  {
    title: "Knowledge Graph",
    url: createPageUrl("Graph"),
    icon: Network,
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(true); // Changed from false to true
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const { data: connections = [] } = useQuery({
    queryKey: ['neo4j_connections'],
    queryFn: () => base44.entities.Neo4jConnection.list("-created_date", 1),
    initialData: [],
  });

  const { data: papers = [] } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list("-created_date"),
    initialData: [],
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const activeConnection = connections[0];
  const completedPapers = papers.filter(p => p.processing_status === "completed");
  const totalEntities = completedPapers.reduce((sum, p) => sum + (p.knowledge_graph?.nodes?.length || 0), 0);
  const hasSchema = totalEntities > 0;

  const handleDisconnect = async () => {
    if (activeConnection) {
      await base44.entities.Neo4jConnection.update(activeConnection.id, {
        is_active: false,
        connection_status: "disconnected"
      });
      localStorage.removeItem('neo4j_connection_id');
      window.location.reload();
    }
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className={`border-b ${darkMode ? 'border-slate-700/60' : 'border-slate-200/60'} p-4 md:p-6 space-y-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h2 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>GraphRAG</h2>
              <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Research Intelligence</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setSidebarCollapsed(true); setMobileMenuOpen(false); }}
            className="h-8 w-8 hidden md:flex"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Neo4j Connection Status */}
        <div className={`${darkMode ? 'bg-slate-800/80' : 'bg-slate-50/80'} rounded-lg p-3 space-y-2`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Neo4j connection</h3>
            {activeConnection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Disconnect
              </Button>
            )}
          </div>
          {activeConnection ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className={`text-xs font-mono truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {activeConnection.protocol}://{activeConnection.uri}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasSchema ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Graph Schema configured</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Empty Graph Schema</span>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Not Connected</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1 mb-8">
          <p className={`text-xs font-medium uppercase tracking-wider px-3 py-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Navigation
          </p>
          {navigationItems.map((item) => (
            <Link
              key={item.title}
              to={item.url}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-xl mb-1 
                transition-all duration-200 group relative overflow-hidden
                ${location.pathname === item.url ? 
                  (darkMode 
                    ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50 text-blue-300 shadow-sm border border-blue-800' 
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm border border-blue-100') : 
                  (darkMode 
                    ? 'hover:bg-blue-900/30 hover:text-blue-300' 
                    : 'hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm')
                }
              `}
            >
              <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="font-medium">{item.title}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <p className={`text-xs font-medium uppercase tracking-wider px-3 py-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Quick Insights
          </p>
          <div className="px-3 py-2 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className={`w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Papers</span>
              <span className="ml-auto font-semibold text-blue-600">{completedPapers.length}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Network className={`w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Entities</span>
              <span className="ml-auto font-semibold text-purple-600">{totalEntities}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Lightbulb className={`w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Insights</span>
              <span className="ml-auto font-semibold text-emerald-600">
                {completedPapers.reduce((sum, p) => sum + (p.knowledge_graph?.relationships?.length || 0), 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dark Mode Toggle at Bottom */}
      <div className={`border-t ${darkMode ? 'border-slate-700/60' : 'border-slate-200/60'} p-4`}>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
            darkMode 
              ? 'bg-slate-800 hover:bg-slate-700' 
              : 'bg-slate-100 hover:bg-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {darkMode ? (
              <Moon className="w-5 h-5 text-blue-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {darkMode ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
          <div className={`w-11 h-6 rounded-full relative transition-colors ${
            darkMode ? 'bg-blue-600' : 'bg-slate-300'
          }`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
              darkMode ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
      <style>
        {`
          :root {
            --primary: 220 100% 50%;
            --primary-foreground: 220 10% 98%;
            --secondary: 220 14% 96%;
            --secondary-foreground: 220 9% 46%;
            --muted: 220 14% 96%;
            --muted-foreground: 220 9% 46%;
            --accent: 220 14% 96%;
            --accent-foreground: 220 9% 46%;
            --destructive: 0 84% 60%;
            --destructive-foreground: 210 40% 98%;
            --border: 220 13% 91%;
            --input: 220 13% 91%;
            --ring: 220 100% 50%;
          }
          
          .dark {
            --primary: 220 100% 60%;
            --primary-foreground: 220 10% 10%;
            --secondary: 220 14% 16%;
            --secondary-foreground: 220 9% 86%;
            --muted: 220 14% 16%;
            --muted-foreground: 220 9% 66%;
            --accent: 220 14% 16%;
            --accent-foreground: 220 9% 86%;
            --destructive: 0 84% 60%;
            --destructive-foreground: 210 40% 98%;
            --border: 220 13% 21%;
            --input: 220 13% 21%;
            --ring: 220 100% 60%;
          }
        `}
      </style>
      
      <div className="flex w-full min-h-screen">
        {/* Mobile Menu Button */}
        <div className="md:hidden fixed top-4 left-4 z-40">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} shadow-lg`}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className={`p-0 w-[280px] ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white'}`}>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`hidden md:block fixed left-0 top-0 h-screen border-r ${darkMode ? 'border-slate-700/60 bg-slate-900/80' : 'border-slate-200/60 bg-white/80'} backdrop-blur-xl flex-shrink-0 z-30`}
            >
              <SidebarContent />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed Sidebar Button - Desktop Only */}
        {sidebarCollapsed && (
          <div className={`hidden md:flex fixed left-0 top-0 h-screen border-r ${darkMode ? 'border-slate-700/60 bg-slate-900/80' : 'border-slate-200/60 bg-white/80'} backdrop-blur-xl items-start p-2 z-30`}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(false)}
              className="h-10 w-10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 flex flex-col min-h-screen relative ${!sidebarCollapsed ? 'md:ml-[280px]' : 'md:ml-[56px]'} transition-all duration-200`}>
          {children}
        </div>

        {/* Floating Chat Button - Only show when chat is closed */}
        {!chatOpen && (
          <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
            <Button
              onClick={() => setChatOpen(true)}
              className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
            >
              <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </Button>
          </div>
        )}

        {/* Chat Widget */}
        <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} darkMode={darkMode} />
      </div>
    </div>
  );
}
