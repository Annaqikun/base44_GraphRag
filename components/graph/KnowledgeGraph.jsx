import React, { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Network, 
    ZoomIn, 
    ZoomOut, 
    Maximize, 
    RotateCcw,
    Search,
    FileText,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NodeEditDialog from "./NodeEditDialog";

export default function KnowledgeGraph() {
  const svgRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], relationships: [] });
  const [filteredGraph, setFilteredGraph] = useState({ nodes: [], relationships: [] });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [showDocuments, setShowDocuments] = useState(true);
  const [showEntities, setShowEntities] = useState(true);
  const [selectedPapers, setSelectedPapers] = useState([]);

  const { data: papers = [] } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list("-created_date"),
    initialData: [],
  });

  const completedPapers = papers.filter(p => p.processing_status === "completed");

  const buildCombinedGraph = useCallback(() => {
    const papersToProcess = selectedPapers.length > 0 
      ? completedPapers.filter(p => selectedPapers.includes(p.id))
      : completedPapers;

    const allNodes = [];
    const allRelationships = [];
    const nodeMap = new Map();

    papersToProcess.forEach(paper => {
      if (paper.knowledge_graph) {
        paper.knowledge_graph.nodes?.forEach(node => {
          const existingNode = nodeMap.get(node.label.toLowerCase());
          if (existingNode) {
            existingNode.source_passages = [
              ...(existingNode.source_passages || []),
              ...(node.source_passages || [])
            ];
            existingNode.confidence = Math.max(existingNode.confidence || 0, node.confidence || 0);
          } else {
            const graphNode = {
              ...node,
              id: node.id || Math.random().toString(36).substr(2, 9),
              x: Math.random() * 600 + 100,
              y: Math.random() * 400 + 100,
              paper_id: paper.id,
              paper_title: paper.title
            };
            allNodes.push(graphNode);
            nodeMap.set(node.label.toLowerCase(), graphNode);
          }
        });

        paper.knowledge_graph.relationships?.forEach(rel => {
          allRelationships.push({
            ...rel,
            id: rel.id || Math.random().toString(36).substr(2, 9),
            paper_id: paper.id,
            paper_title: paper.title
          });
        });
      }
    });

    setGraphData({ nodes: allNodes, relationships: allRelationships });
  }, [completedPapers, selectedPapers]);

  useEffect(() => {
    if (completedPapers.length > 0) {
      buildCombinedGraph();
    }
  }, [completedPapers, selectedPapers, buildCombinedGraph]);

  useEffect(() => {
    // Filter graph based on search and toggles
    let filtered = { ...graphData };
    
    if (searchQuery) {
      filtered.nodes = filtered.nodes.filter(n => 
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const nodeIds = new Set(filtered.nodes.map(n => n.id));
      filtered.relationships = filtered.relationships.filter(r => 
        nodeIds.has(r.source_id) && nodeIds.has(r.target_id)
      );
    }

    setFilteredGraph(filtered);
  }, [graphData, searchQuery, showDocuments, showEntities]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleNodeEdit = (node) => {
    setEditingNode(node);
  };

  const handleNodeDelete = async (nodeId) => {
    setGraphData(prev => ({
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      relationships: prev.relationships.filter(r => r.source_id !== nodeId && r.target_id !== nodeId)
    }));
    setSelectedNode(null);
  };

  const handleZoom = (direction) => {
    const newZoom = direction === 'in' ? Math.min(zoom * 1.2, 3) : Math.max(zoom / 1.2, 0.5);
    setZoom(newZoom);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const togglePaperSelection = (paperId) => {
    setSelectedPapers(prev => 
      prev.includes(paperId) 
        ? prev.filter(id => id !== paperId)
        : [...prev, paperId]
    );
  };

  const getNodeColor = (nodeType) => {
    const colors = {
      'Person': '#3B82F6',
      'Concept': '#8B5CF6',
      'Method': '#10B981',
      'Location': '#F59E0B',
      'Organization': '#EF4444',
      'Algorithm': '#06B6D4',
      'Dataset': '#84CC16'
    };
    return colors[nodeType] || '#6B7280';
  };

  // Count nodes by type
  const nodeTypeCounts = filteredGraph.nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});

  const relationshipTypeCounts = filteredGraph.relationships.reduce((acc, rel) => {
    acc[rel.type] = (acc[rel.type] || 0) + 1;
    return acc;
  }, {});

  const renderGraph = () => {
    if (filteredGraph.nodes.length === 0) return null;

    return (
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        {/* Relationships */}
        {filteredGraph.relationships.map(rel => {
          const sourceNode = filteredGraph.nodes.find(n => n.id === rel.source_id);
          const targetNode = filteredGraph.nodes.find(n => n.id === rel.target_id);
          
          if (!sourceNode || !targetNode) return null;

          return (
            <g key={rel.id}>
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="#CBD5E1"
                strokeWidth="2"
                opacity="0.6"
              />
            </g>
          );
        })}

        {/* Nodes */}
        {filteredGraph.nodes.map(node => (
          <g key={node.id} onClick={() => handleNodeClick(node)} className="cursor-pointer">
            <circle
              cx={node.x}
              cy={node.y}
              r="20"
              fill={getNodeColor(node.type)}
              stroke={selectedNode?.id === node.id ? "#1F2937" : "white"}
              strokeWidth={selectedNode?.id === node.id ? "3" : "2"}
              className="hover:opacity-80 transition-opacity"
            />
            <text
              x={node.x}
              y={node.y + 30}
              textAnchor="middle"
              fontSize="12"
              fill="#1F2937"
              className="pointer-events-none font-medium"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex gap-6 h-[calc(100vh-8rem)]">
          {/* Main Graph Area */}
          <div className="flex-1 flex flex-col">
            <Card className="flex-1 bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
              <CardHeader className="border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900 flex items-center gap-2">
                      Generated Graph
                    </CardTitle>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="documents"
                          checked={showDocuments}
                          onCheckedChange={setShowDocuments}
                        />
                        <label htmlFor="documents" className="text-sm font-medium cursor-pointer">
                          Document & Chunk
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="entities"
                          checked={showEntities}
                          onCheckedChange={setShowEntities}
                        />
                        <label htmlFor="entities" className="text-sm font-medium cursor-pointer">
                          Entities
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleZoom('out')}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleZoom('in')}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetView}>
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 relative flex-1">
                <div className="absolute inset-0 bg-slate-50/30">
                  {filteredGraph.nodes.length > 0 ? (
                    renderGraph()
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Network className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No knowledge graph data available</p>
                        <p className="text-slate-400 text-sm">Upload and process documents to see the graph</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Result Overview */}
          <div className="w-96">
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg h-full flex flex-col">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle className="text-slate-900">Result Overview</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search On Node Properties"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              
              <ScrollArea className="flex-1">
                <CardContent className="p-4 space-y-6">
                  {/* Total Nodes */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">
                      Total Nodes ({filteredGraph.nodes.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(nodeTypeCounts).map(([type, count]) => (
                        <Badge 
                          key={type}
                          style={{ backgroundColor: getNodeColor(type) + '20', color: getNodeColor(type) }}
                          className="border-0"
                        >
                          {type} ({count})
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Total Relationships */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">
                      Total Relationships ({filteredGraph.relationships.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(relationshipTypeCounts).map(([type, count]) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type} ({count})
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Documents</h4>
                    <div className="space-y-2">
                      {completedPapers.map(paper => (
                        <div 
                          key={paper.id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
                          onClick={() => togglePaperSelection(paper.id)}
                        >
                          <Checkbox 
                            checked={selectedPapers.includes(paper.id) || selectedPapers.length === 0}
                            onCheckedChange={() => togglePaperSelection(paper.id)}
                          />
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-700 flex-1 truncate">{paper.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>

      {/* Node Edit Dialog */}
      {editingNode && (
        <NodeEditDialog
          node={editingNode}
          onSave={(updatedNode) => {
            setGraphData(prev => ({
              ...prev,
              nodes: prev.nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
            }));
            setEditingNode(null);
            setSelectedNode(updatedNode);
          }}
          onClose={() => setEditingNode(null)}
        />
      )}
    </div>
  );
}