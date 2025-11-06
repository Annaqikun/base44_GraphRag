
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // Import useQueryClient
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Network, 
    ZoomIn, 
    ZoomOut, 
    Maximize, 
    RotateCcw,
    Search,
    Sparkles,
    Download,
    FileJson
} from "lucide-react";
import { motion } from "framer-motion";

import DocumentsList from "../components/graph/DocumentsList";
import NodeEditDialog from "../components/graph/NodeEditDialog";
import GraphEnhancementsDialog from "../components/graph/GraphEnhancementsDialog"; // New import

export default function GraphPage() {
  const [selectedPaperIds, setSelectedPaperIds] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [showEnhancements, setShowEnhancements] = useState(false); // New state for dialog visibility
  const [graphData, setGraphData] = useState({ nodes: [], relationships: [] });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [showDocuments, setShowDocuments] = useState(true);
  const [showEntities, setShowEntities] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const queryClient = useQueryClient(); // Initialize useQueryClient

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const { data: papers = [], isLoading } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list("-created_date"),
    initialData: [],
  });

  const completedPapers = papers.filter(p => p.processing_status === "completed");

  // Calculate duplicates and disconnected nodes
  const allNodes = completedPapers
    .filter(p => selectedPaperIds.includes(p.id))
    .flatMap(paper => 
      (paper.knowledge_graph?.nodes || []).map(node => ({
        ...node,
        paper_id: paper.id,
        paper_title: paper.title
      }))
    );

  const allRelationships = completedPapers
    .filter(p => selectedPaperIds.includes(p.id))
    .flatMap(paper => paper.knowledge_graph?.relationships || []);

  // Count disconnected nodes
  const disconnectedCount = allNodes.filter(node => {
    const hasConnection = allRelationships.some(rel => 
      rel.source_id === node.id || rel.target_id === node.id
    );
    return !hasConnection;
  }).length;

  // Count duplicate groups
  const duplicateGroupsCount = (() => {
    const groups = {};
    allNodes.forEach(node => {
      const normalizedLabel = node.label?.toLowerCase().trim();
      if (normalizedLabel) {
        if (!groups[normalizedLabel]) {
          groups[normalizedLabel] = [];
        }
        groups[normalizedLabel].push(node);
      }
    });
    return Object.values(groups).filter(nodes => nodes.length > 1).length;
  })();

  const hasIssues = disconnectedCount > 0 || duplicateGroupsCount > 0;

  const buildCombinedGraph = useCallback(() => {
    if (selectedPaperIds.length === 0) {
      setGraphData({ nodes: [], relationships: [] });
      return;
    }

    const allNodes = [];
    const allRelationships = [];
    const nodeMap = new Map();

    selectedPaperIds.forEach(paperId => {
      const paper = completedPapers.find(p => p.id === paperId);
      if (!paper || !paper.knowledge_graph) return;

      paper.knowledge_graph.nodes?.forEach((node, index) => {
        const nodeKey = node.label?.toLowerCase();
        if (!nodeKey) return;

        if (nodeMap.has(nodeKey)) {
          const existingNode = nodeMap.get(nodeKey);
          existingNode.source_passages = [
            ...(existingNode.source_passages || []),
            ...(node.source_passages || [])
          ];
          existingNode.papers = [...new Set([...(existingNode.papers || []), paper.title])];
        } else {
          const graphNode = {
            ...node,
            id: node.id || `node-${paperId}-${index}`,
            x: node.position?.x || Math.random() * 600 + 100,
            y: node.position?.y || Math.random() * 400 + 100,
            paper_id: paper.id,
            paper_title: paper.title,
            papers: [paper.title]
          };
          allNodes.push(graphNode);
          nodeMap.set(nodeKey, graphNode);
        }
      });

      paper.knowledge_graph.relationships?.forEach((rel, index) => {
        allRelationships.push({
          ...rel,
          id: rel.id || `rel-${paperId}-${index}`,
          paper_id: paper.id,
          paper_title: paper.title
        });
      });
    });

    setGraphData({ nodes: allNodes, relationships: allRelationships });
  }, [selectedPaperIds, completedPapers]);

  useEffect(() => {
    buildCombinedGraph();
  }, [buildCombinedGraph]);

  useEffect(() => {
    if (selectedPaperIds.length === 0 && completedPapers.length > 0) {
      setSelectedPaperIds([completedPapers[0].id]);
    }
  }, [completedPapers]);

  const handlePaperSelection = (paperIdOrIds) => {
    if (Array.isArray(paperIdOrIds)) {
      setSelectedPaperIds(paperIdOrIds);
    } else {
      setSelectedPaperIds(prev => {
        if (prev.includes(paperIdOrIds)) {
          return prev.filter(id => id !== paperIdOrIds);
        } else {
          return [...prev, paperIdOrIds];
        }
      });
    }
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleNodeEdit = (node) => {
    setEditingNode(node);
  };

  const handleNodeSave = async (updatedNode) => {
    setGraphData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
    }));

    const paper = completedPapers.find(p => p.id === updatedNode.paper_id);
    if (paper) {
      const updatedGraph = {
        ...paper.knowledge_graph,
        nodes: paper.knowledge_graph.nodes.map(n => 
          n.id === updatedNode.id ? updatedNode : n
        )
      };
      await base44.entities.ResearchPaper.update(paper.id, {
        knowledge_graph: updatedGraph
      });
    }

    setEditingNode(null);
    setSelectedNode(updatedNode);
    queryClient.invalidateQueries({ queryKey: ['papers'] }); // Invalidate and refetch papers to update source data and badge counts
  };

  const handleNodeDelete = async (nodeId) => {
    setGraphData(prev => ({
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      relationships: prev.relationships.filter(r => 
        r.source_id !== nodeId && r.target_id !== nodeId
      )
    }));

    const nodeToDelete = graphData.nodes.find(n => n.id === nodeId);
    if (nodeToDelete) {
      const paper = completedPapers.find(p => p.id === nodeToDelete.paper_id);
      if (paper) {
        const updatedGraph = {
          nodes: paper.knowledge_graph.nodes.filter(n => n.id !== nodeId),
          relationships: paper.knowledge_graph.relationships.filter(r => 
            r.source_id !== nodeId && r.target_id !== nodeId
          )
        };
        await base44.entities.ResearchPaper.update(paper.id, {
          knowledge_graph: updatedGraph
        });
      }
    }

    setSelectedNode(null);
    queryClient.invalidateQueries({ queryKey: ['papers'] }); // Invalidate and refetch papers to update source data and badge counts
  };

  const handleExportGraph = () => {
    const selectedPapers = completedPapers.filter(p => selectedPaperIds.includes(p.id));
    
    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      papers: selectedPapers.map(p => ({
        id: p.id,
        title: p.title,
        authors: p.authors
      })),
      graph: {
        nodes: filteredGraph.nodes,
        relationships: filteredGraph.relationships
      },
      metadata: {
        total_nodes: filteredGraph.nodes.length,
        total_relationships: filteredGraph.relationships.length,
        node_types: Object.keys(nodeTypeCounts),
        relationship_types: Object.keys(relationshipTypeCounts)
      }
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `knowledge-graph-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleZoom = (direction) => {
    // These controls are disabled in the static placeholder view
    // const newZoom = direction === 'in' ? Math.min(zoom * 1.2, 3) : Math.max(zoom / 1.2, 0.5);
    // setZoom(newZoom);
  };

  const resetView = () => {
    // These controls are disabled in the static placeholder view
    // setZoom(1);
    // setPan({ x: 0, y: 0 });
  };

  const getNodeColor = (nodeType) => {
    const colors = {
      'Person': '#3B82F6',
      'Concept': '#8B5CF6',
      'Method': '#10B981',
      'Location': '#F59E0B',
      'Organization': '#EF4444',
      'Algorithm': '#06B6D4',
      'Dataset': '#84CC16',
      'Technology': '#EC4899',
      'Event': '#F97316'
    };
    return colors[nodeType] || '#6B7280';
  };

  const filteredGraph = {
    nodes: graphData.nodes.filter(n => 
      !searchQuery || 
      n.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.type?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    relationships: graphData.relationships
  };

  const nodeTypeCounts = filteredGraph.nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});

  const relationshipTypeCounts = filteredGraph.relationships.reduce((acc, rel) => {
    acc[rel.type] = (acc[rel.type] || 0) + 1;
    return acc;
  }, {});

  const renderGraph = (isDarkMode) => {
    if (filteredGraph.nodes.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Network className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className={`font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>No knowledge graph available</p>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {selectedPaperIds.length === 0
                ? "Select documents below to view their knowledge graph" 
                : "Selected documents haven't been processed yet"}
            </p>
          </div>
        </div>
      );
    }

    // Simple static placeholder visualization
    const svgWidth = 1400;
    const svgHeight = 600;

    // Position nodes in a circular layout for visual appeal
    const positionedNodes = filteredGraph.nodes.slice(0, 30).map((node, i) => {
      const angle = (i / Math.min(filteredGraph.nodes.length, 30)) * 2 * Math.PI;
      const radius = 180;
      return {
        ...node,
        x: node.x || svgWidth / 2 + radius * Math.cos(angle),
        y: node.y || svgHeight / 2 + radius * Math.sin(angle)
      };
    });

    return (
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className={isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50/30'}
      >
        {/* Relationships */}
        {filteredGraph.relationships.slice(0, 40).map((rel, i) => {
          const sourceNode = positionedNodes.find(n => n.id === rel.source_id);
          const targetNode = positionedNodes.find(n => n.id === rel.target_id);
          
          if (!sourceNode || !targetNode) return null;

          return (
            <line
              key={i}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke="#CBD5E1" // Light grey for lines, might need adjusting for dark mode too if it blends
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
              fill={getNodeColor(node.type)}
              stroke="white"
              strokeWidth="2"
              opacity="0.9"
            />
          </g>
        ))}
      </svg>
    );
  };

  const selectedPaperTitles = completedPapers
    .filter(p => selectedPaperIds.includes(p.id))
    .map(p => p.title);

  return (
    <div className={`min-h-screen p-4 md:p-6 ${darkMode ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 pt-12 md:pt-0"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"> {/* Adjusted flex container */}
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Knowledge Graph</h1>
              <p className={`text-sm md:text-base ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Interactive visualization of research concepts and relationships
              </p>
            </div>
            <div className="relative">
              <Button
                onClick={() => setShowEnhancements(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Graph Enhancements
              </Button>
              {hasIssues && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 flex items-center gap-1"
                >
                  {duplicateGroupsCount > 0 && (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 text-xs">
                      {duplicateGroupsCount}
                    </Badge>
                  )}
                  {disconnectedCount > 0 && (
                    <Badge className="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 text-xs">
                      {disconnectedCount}
                    </Badge>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Issues Alert Banner */}
          {hasIssues && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                darkMode 
                  ? 'bg-amber-900/20 border-amber-700/50' 
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <Sparkles className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              <div className="flex-1">
                <p className={`font-medium text-sm ${darkMode ? 'text-amber-300' : 'text-amber-900'}`}>
                  Graph Quality Issues Detected
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-amber-400/80' : 'text-amber-700'}`}>
                  {duplicateGroupsCount > 0 && `${duplicateGroupsCount} duplicate group${duplicateGroupsCount > 1 ? 's' : ''}`}
                  {duplicateGroupsCount > 0 && disconnectedCount > 0 && ' • '}
                  {disconnectedCount > 0 && `${disconnectedCount} disconnected node${disconnectedCount > 1 ? 's' : ''}`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEnhancements(true)}
                className={`${darkMode ? 'border-amber-600 hover:bg-amber-900/30 text-amber-300' : 'border-amber-300 hover:bg-amber-100 text-amber-700'}`}
              >
                Fix Issues
              </Button>
            </motion.div>
          )}

          {selectedPaperIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedPaperTitles.map((title, idx) => (
                <Badge key={idx} className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 text-xs md:text-sm">
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  {title.substring(0, 30)}...
                </Badge>
              ))}
            </div>
          )}
        </motion.div>

        {/* Graph Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`${darkMode ? 'bg-slate-800/70 border-slate-700/60' : 'bg-white/70 border-slate-200/60'} backdrop-blur-sm shadow-lg`}>
            <CardHeader className={`border-b ${darkMode ? 'border-slate-700/60' : 'border-slate-200/60'}`}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className={darkMode ? 'text-white' : 'text-slate-900'}>Generated Graph</CardTitle>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportGraph}
                      disabled={filteredGraph.nodes.length === 0}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleZoom('out')}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleZoom('in')}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetView}>
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search nodes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 ${darkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400' : ''}`}
                  />
                </div>

                {/* Stats - Stack on mobile */}
                <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Nodes:</span>
                    <Badge variant="secondary" className="font-semibold">
                      {filteredGraph.nodes.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Relationships:</span>
                    <Badge variant="secondary" className="font-semibold">
                      {filteredGraph.relationships.length}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row">
                {/* Graph Visualization - Full width on mobile */}
                <div className={`flex-1 h-[400px] md:h-[600px] relative ${darkMode ? 'bg-slate-900/30' : 'bg-slate-50/30'}`}>
                  {renderGraph(darkMode)}
                </div>

                {/* Result Overview - Below graph on mobile, sidebar on desktop */}
                <div className={`w-full lg:w-80 border-t lg:border-t-0 lg:border-l ${darkMode ? 'border-slate-700/60 bg-slate-800/30' : 'border-slate-200/60 bg-slate-50/30'}`}>
                  <ScrollArea className="h-[300px] md:h-[600px]">
                    <div className="p-4 space-y-6">
                      {/* Node Types */}
                      <div>
                        <h4 className={`font-semibold mb-3 text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          Node Types
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(nodeTypeCounts).map(([type, count]) => (
                            <Badge 
                              key={type}
                              style={{ 
                                backgroundColor: getNodeColor(type) + '20', 
                                color: getNodeColor(type),
                                borderColor: getNodeColor(type)
                              }}
                              className="border text-xs px-2 py-1"
                            >
                              {type} ({count})
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Relationship Types */}
                      <div>
                        <h4 className={`font-semibold mb-3 text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          Relationship Types
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(relationshipTypeCounts).map(([type, count]) => (
                            <Badge 
                              key={type} 
                              variant="outline" 
                              className="text-xs px-2 py-1"
                            >
                              {type} ({count})
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Selected Node Details */}
                      {selectedNode && (
                        <div className={`pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                          <h4 className={`font-semibold mb-3 text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Selected Node
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Label:</span>
                              <p className={darkMode ? 'text-white' : 'text-slate-900'}>{selectedNode.label}</p>
                            </div>
                            <div>
                              <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Type:</span>
                              <Badge 
                                className="ml-2"
                                style={{ 
                                  backgroundColor: getNodeColor(selectedNode.type) + '20',
                                  color: getNodeColor(selectedNode.type)
                                }}
                              >
                                {selectedNode.type}
                              </Badge>
                            </div>
                            {selectedNode.papers && selectedNode.papers.length > 0 && (
                              <div>
                                <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>From Papers:</span>
                                <div className="mt-1 space-y-1">
                                  {selectedNode.papers.map((paper, idx) => (
                                    <p key={idx} className={`text-xs truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                      • {paper}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Documents List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <DocumentsList
            papers={completedPapers}
            selectedPaperIds={selectedPaperIds}
            onSelectPaper={handlePaperSelection}
            multiSelect={true}
            darkMode={darkMode}
          />
        </motion.div>
      </div>

      {/* Node Edit Dialog */}
      {editingNode && (
        <NodeEditDialog
          node={editingNode}
          onSave={handleNodeSave}
          onClose={() => setEditingNode(null)}
          onDelete={handleNodeDelete}
        />
      )}

      {/* Graph Enhancements Dialog */}
      <GraphEnhancementsDialog
        isOpen={showEnhancements}
        onClose={() => setShowEnhancements(false)}
        papers={completedPapers.filter(p => selectedPaperIds.includes(p.id))}
        onUpdate={() => {
          queryClient.invalidateQueries({ queryKey: ['papers'] }); // Invalidate and refetch papers
          buildCombinedGraph(); // Rebuild graph after updates
        }}
        darkMode={darkMode}
      />
    </div>
  );
}
