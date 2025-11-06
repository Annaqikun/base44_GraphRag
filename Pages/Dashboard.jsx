
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
    Brain, 
    Upload, 
    BookOpen, 
    Network, 
    TrendingUp, 
    Calendar,
    FileText,
    Plus,
    Search,
    CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";

import StatsCard from "../components/dashboard/StatsCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import DocumentsList from "../components/graph/DocumentsList";
import Neo4jAuthDialog from "../components/auth/Neo4jAuthDialog";

export default function Dashboard() {
  const [hasConnection, setHasConnection] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPapers, setSelectedPapers] = useState([]);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const { data: papers = [], isLoading } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list("-created_date"),
    initialData: [],
  });

  const { data: connections = [] } = useQuery({
    queryKey: ['neo4j_connections'],
    queryFn: () => base44.entities.Neo4jConnection.list("-created_date", 1),
    initialData: [],
  });

  useEffect(() => {
    const connectionId = localStorage.getItem('neo4j_connection_id');
    if (connectionId || connections.length > 0) {
      setHasConnection(true);
    } else {
      setShowAuthDialog(true);
    }
  }, [connections]);

  const completedPapers = papers.filter(p => p.processing_status === "completed");
  const filteredPapers = completedPapers.filter(paper =>
    paper.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalPapers: completedPapers.length,
    totalNodes: completedPapers.reduce((sum, p) => sum + (p.knowledge_graph?.nodes?.length || 0), 0),
    totalRelationships: completedPapers.reduce((sum, p) => sum + (p.knowledge_graph?.relationships?.length || 0), 0),
    processedThisWeek: completedPapers.filter(p => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(p.created_date) > weekAgo;
    }).length
  };

  const togglePaperSelection = (paperId) => {
    setSelectedPapers(prev => 
      prev.includes(paperId) 
        ? prev.filter(id => id !== paperId)
        : [...prev, paperId]
    );
  };

  // Build combined graph from selected papers
  const buildPreviewGraph = () => {
    const papersToShow = selectedPapers.length > 0 
      ? completedPapers.filter(p => selectedPapers.includes(p.id))
      : completedPapers.slice(0, 3);

    const allNodes = [];
    const allRelationships = [];

    papersToShow.forEach(paper => {
      if (paper.knowledge_graph) {
        allNodes.push(...(paper.knowledge_graph.nodes || []));
        allRelationships.push(...(paper.knowledge_graph.relationships || []));
      }
    });

    return { nodes: allNodes.slice(0, 50), relationships: allRelationships.slice(0, 50) };
  };

  const previewGraph = buildPreviewGraph();

  const handleViewPaperGraph = (paperId) => {
    // Navigate to Graph page with selected paper
    window.location.href = createPageUrl("Graph") + `?paper=${paperId}`;
  };

  return (
    <>
      <Neo4jAuthDialog 
        isOpen={showAuthDialog} 
        onSuccess={() => {
          setShowAuthDialog(false);
          setHasConnection(true);
        }} 
      />

      <div className={`min-h-screen p-4 md:p-6 ${darkMode ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 md:gap-6 pt-12 md:pt-0"
          >
            <div>
              <h1 className={`text-2xl md:text-4xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Research Dashboard
              </h1>
            </div>
            <div className="flex gap-3">
              <Link to={createPageUrl("Upload")} className="w-full md:w-auto">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Paper
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          >
            <StatsCard
              title="Research Papers"
              value={stats.totalPapers}
              icon={BookOpen}
              trend="+12% this month"
              color="blue"
              darkMode={darkMode}
            />
            <StatsCard
              title="Knowledge Nodes"
              value={stats.totalNodes}
              icon={Network}
              trend="+8% this week"
              color="purple"
              darkMode={darkMode}
            />
            <StatsCard
              title="Relationships"
              value={stats.totalRelationships}
              icon={Brain}
              trend="+15% this week"
              color="emerald"
              darkMode={darkMode}
            />
            <StatsCard
              title="Recent Activity"
              value={stats.processedThisWeek}
              icon={TrendingUp}
              trend="Past 7 days"
              color="amber"
              darkMode={darkMode}
            />
          </motion.div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Graph Preview */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className={`${darkMode ? 'bg-slate-800/70 border-slate-700/60' : 'bg-white/70 border-slate-200/60'} backdrop-blur-sm shadow-lg`}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <CardTitle className={darkMode ? 'text-white' : 'text-slate-900'}>Knowledge Graph Preview</CardTitle>
                      <Link to={createPageUrl("Graph")}>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <Network className="w-4 h-4 mr-2" />
                          Full View
                        </Button>
                      </Link>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Interactive visualization of your research connections
                    </p>
                  </CardHeader>
                  <CardContent>
                    {previewGraph.nodes.length > 0 ? (
                      <GraphPreview 
                        nodes={previewGraph.nodes} 
                        relationships={previewGraph.relationships}
                        darkMode={darkMode}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <Network className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                        <p className={`mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>No knowledge graph data yet</p>
                        <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Upload and process documents to see your graph</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <RecentActivity papers={completedPapers.slice(0, 5)} darkMode={darkMode} />
            </div>
          </div>

          {/* Documents List - Using the same component as Graph page */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <DocumentsList
              papers={completedPapers}
              selectedPaperId={null}
              onSelectPaper={handleViewPaperGraph}
              darkMode={darkMode}
            />
          </motion.div>
        </div>
      </div>
    </>
  );
}

// Simple graph preview component
function GraphPreview({ nodes, relationships, darkMode = false }) {
  const svgWidth = 600;
  const svgHeight = 400;

  // Position nodes in a circular layout
  const positionedNodes = nodes.map((node, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI;
    const radius = 120;
    return {
      ...node,
      x: svgWidth / 2 + radius * Math.cos(angle),
      y: svgHeight / 2 + radius * Math.sin(angle)
    };
  });

  const nodeColors = {
    'Person': '#3B82F6',
    'Concept': '#8B5CF6',
    'Method': '#10B981',
    'Location': '#F59E0B',
    'Organization': '#EF4444',
  };

  return (
    <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className={darkMode ? 'bg-slate-900/30 rounded-lg' : 'bg-slate-50/30 rounded-lg'}>
      {/* Relationships */}
      {relationships.map((rel, i) => {
        const source = positionedNodes.find(n => n.id === rel.source_id);
        const target = positionedNodes.find(n => n.id === rel.target_id);
        if (!source || !target) return null;
        
        return (
          <line
            key={i}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            stroke={darkMode ? "#475569" : "#CBD5E1"}
            strokeWidth="1.5"
            opacity="0.4"
          />
        );
      })}

      {/* Nodes */}
      {positionedNodes.map((node, i) => (
        <g key={i}>
          <circle
            cx={node.x}
            cy={node.y}
            r="8"
            fill={nodeColors[node.type] || '#6B7280'}
            stroke={darkMode ? "#1e293b" : "white"}
            strokeWidth="2"
            opacity="0.9"
          />
        </g>
      ))}
    </svg>
  );
}
