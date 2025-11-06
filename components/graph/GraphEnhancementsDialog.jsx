
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Network, Trash2, GitMerge, X, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function GraphEnhancementsDialog({ isOpen, onClose, papers, onUpdate, darkMode = false }) {
  const [activeTab, setActiveTab] = useState("disconnected");
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [pageSize, setPageSize] = useState(5);
  const [duplicatePageSize, setDuplicatePageSize] = useState(5);

  // Get all nodes from papers
  const allNodes = papers.flatMap(paper =>
    (paper.knowledge_graph?.nodes || []).map(node => ({
      ...node,
      paper_id: paper.id,
      paper_title: paper.title
    }))
  );

  const allRelationships = papers.flatMap(paper =>
    paper.knowledge_graph?.relationships || []
  );

  // Find disconnected nodes (nodes with no relationships)
  const disconnectedNodes = allNodes.filter(node => {
    const hasConnection = allRelationships.some(rel =>
      rel.source_id === node.id || rel.target_id === node.id
    );
    return !hasConnection;
  });

  // Demo data for disconnected nodes when there are none
  const demoDisconnectedNodes = [
    {
      id: "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
      label: "Quantum Computing",
      type: "Concept",
      paper_id: "demo1",
      paper_title: "Advanced Computing Technologies 2024",
      source_passages: [
        { text: "Quantum computing represents a paradigm shift...", page: 12, confidence: 0.91 }
      ]
    },
    {
      id: "2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q",
      label: "Dr. Sarah Johnson",
      type: "Person",
      paper_id: "demo2",
      paper_title: "Research Methodologies in AI",
      source_passages: [
        { text: "Dr. Sarah Johnson contributed to this research...", page: 3, confidence: 0.88 }
      ]
    },
    {
      id: "3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r",
      label: "Stanford University",
      type: "Organization",
      paper_id: "demo3",
      paper_title: "Educational Institutions Study",
      source_passages: [
        { text: "Stanford University has been at the forefront...", page: 7, confidence: 0.93 }
      ]
    },
    {
      id: "4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s",
      label: "Blockchain Protocol",
      type: "Technology",
      paper_id: "demo4",
      paper_title: "Distributed Systems Architecture",
      source_passages: [
        { text: "The blockchain protocol ensures data integrity...", page: 15, confidence: 0.86 }
      ]
    },
    {
      id: "5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t",
      label: "Climate Change",
      type: "Event",
      paper_id: "demo5",
      paper_title: "Environmental Impact Assessment 2024",
      source_passages: [
        { text: "Climate change poses significant challenges...", page: 4, confidence: 0.94 }
      ]
    }
  ];

  const displayDisconnectedNodes = disconnectedNodes.length > 0 ? disconnectedNodes : demoDisconnectedNodes;

  // Find potential duplicates (nodes with similar labels)
  const findDuplicates = () => {
    const groups = {};
    allNodes.forEach(node => {
      const normalizedLabel = node.label?.toLowerCase().trim();
      if (!normalizedLabel) return;

      if (!groups[normalizedLabel]) {
        groups[normalizedLabel] = [];
      }
      groups[normalizedLabel].push(node);
    });

    return Object.entries(groups)
      .filter(([_, nodes]) => nodes.length > 1)
      .map(([label, nodes]) => ({
        label,
        nodes,
        count: nodes.length
      }));
  };

  const duplicateGroups = findDuplicates();

  // Demo data for when there are no actual duplicates
  const demoGroups = [
    {
      label: "Apple",
      count: 3,
      nodes: [
        {
          id: "9e5fed20-c195-4f59-b758-7e57c758c9fe",
          label: "Apple",
          type: "Organization",
          paper_id: "demo1",
          paper_title: "Technology Market Analysis 2024",
          source_passages: [
            { text: "Apple Inc. announced record revenue...", page: 1, confidence: 0.95 }
          ]
        },
        {
          id: "3a7bcd40-e285-5g60-c869-8f68d869d0gf",
          label: "Apple Inc.",
          type: "Organization",
          paper_id: "demo2",
          paper_title: "Financial Reports Q3 2024",
          source_passages: [
            { text: "Apple Inc. reported strong earnings...", page: 2, confidence: 0.92 }
          ]
        },
        {
          id: "7f4ade60-g396-6h71-d970-9g79e970e1hg",
          label: "Apple Corporation",
          type: "Organization",
          paper_id: "demo3",
          paper_title: "Industry Leaders Overview",
          source_passages: [
            { text: "Apple Corporation continues to lead...", page: 5, confidence: 0.88 }
          ]
        }
      ]
    },
    {
      label: "Machine Learning",
      count: 2,
      nodes: [
        {
          id: "4b8cef30-f407-7i82-e081-0h80f081f2ih",
          label: "Machine Learning",
          type: "Concept",
          paper_id: "demo4",
          paper_title: "AI Research Advances 2024",
          source_passages: [
            { text: "Machine learning techniques have evolved...", page: 3, confidence: 0.96 }
          ]
        },
        {
          id: "5c9dfg40-g518-8j93-f192-1i91g192g3ji",
          label: "ML",
          type: "Concept",
          paper_id: "demo5",
          paper_title: "Deep Learning Applications",
          source_passages: [
            { text: "ML algorithms are widely used...", page: 7, confidence: 0.89 }
          ]
        }
      ]
    }
  ];

  const displayGroups = duplicateGroups.length > 0 ? duplicateGroups : demoGroups;

  const handleSelectNode = (nodeId) => {
    setSelectedNodes(prev =>
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  const handleSelectAll = (nodeIds) => {
    if (selectedNodes.length === nodeIds.length) {
      setSelectedNodes([]);
    } else {
      setSelectedNodes(nodeIds);
    }
  };

  const handleDeleteNodes = async () => {
    if (selectedNodes.length === 0) return;

    // Don't actually delete demo data
    if (disconnectedNodes.length === 0) {
      alert("This is demo data. Upload and process documents to see real disconnected nodes.");
      return;
    }

    // Group nodes by paper
    const nodesByPaper = {};
    selectedNodes.forEach(nodeId => {
      const node = allNodes.find(n => n.id === nodeId);
      if (node) {
        if (!nodesByPaper[node.paper_id]) {
          nodesByPaper[node.paper_id] = [];
        }
        nodesByPaper[node.paper_id].push(nodeId);
      }
    });

    // Update each paper
    for (const [paperId, nodeIds] of Object.entries(nodesByPaper)) {
      const paper = papers.find(p => p.id === paperId);
      if (paper) {
        const updatedGraph = {
          ...paper.knowledge_graph,
          nodes: paper.knowledge_graph.nodes.filter(n => !nodeIds.includes(n.id)),
          relationships: paper.knowledge_graph.relationships.filter(r =>
            !nodeIds.includes(r.source_id) && !nodeIds.includes(r.target_id)
          )
        };
        await base44.entities.ResearchPaper.update(paperId, {
          knowledge_graph: updatedGraph
        });
      }
    }

    setSelectedNodes([]);
    onUpdate();
  };

  const handleMergeDuplicates = async (group) => {
    if (group.nodes.length < 2) return;

    // Don't actually merge demo data
    if (duplicateGroups.length === 0) {
      alert("This is demo data. Upload and process documents to see real duplicates.");
      return;
    }

    // Keep the first node and merge others into it
    const primaryNode = group.nodes[0];
    const nodesToMerge = group.nodes.slice(1);

    // Collect all source passages
    const allPassages = group.nodes.flatMap(n => n.source_passages || []);

    // Update primary node
    const paper = papers.find(p => p.id === primaryNode.paper_id);
    if (paper) {
      const updatedNodes = paper.knowledge_graph.nodes.map(n =>
        n.id === primaryNode.id
          ? { ...n, source_passages: allPassages }
          : n
      );

      // Remove duplicate nodes
      const nodeIdsToRemove = nodesToMerge.map(n => n.id);
      const finalNodes = updatedNodes.filter(n => !nodeIdsToRemove.includes(n.id));

      // Update relationships to point to primary node
      const updatedRelationships = paper.knowledge_graph.relationships.map(rel => ({
        ...rel,
        source_id: nodeIdsToRemove.includes(rel.source_id) ? primaryNode.id : rel.source_id,
        target_id: nodeIdsToRemove.includes(rel.target_id) ? primaryNode.id : rel.target_id
      }));

      await base44.entities.ResearchPaper.update(paper.id, {
        knowledge_graph: {
          nodes: finalNodes,
          relationships: updatedRelationships
        }
      });
    }

    onUpdate();
  };

  const getNodeColor = (nodeType) => {
    const colors = {
      'Person': 'bg-blue-100 text-blue-700',
      'Concept': 'bg-purple-100 text-purple-700',
      'Method': 'bg-green-100 text-green-700',
      'Location': 'bg-amber-100 text-amber-700',
      'Organization': 'bg-red-100 text-red-700',
      'Algorithm': 'bg-cyan-100 text-cyan-700',
      'Dataset': 'bg-lime-100 text-lime-700',
      'Technology': 'bg-pink-100 text-pink-700',
      'Event': 'bg-orange-100 text-orange-700'
    };
    return colors[nodeType] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-[90vw] w-full max-h-[90vh] ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white'}`}>
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className={`flex items-center gap-2 text-xl ${darkMode ? 'text-white' : ''}`}>
                <Network className="w-6 h-6" />
                Graph Enhancements
              </DialogTitle>
              <DialogDescription className={`mt-2 ${darkMode ? 'text-slate-400' : ''}`}>
                This set of tools will help you enhance the quality of your Knowledge Graph by removing possible duplicated entities, disconnected nodes and set a Graph Schema for improving the quality of the entity extraction process
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className={`grid w-full grid-cols-2 ${darkMode ? 'bg-slate-800' : ''}`}>
            <TabsTrigger value="disconnected" className="flex items-center gap-2">
              Disconnected Nodes
              {displayDisconnectedNodes.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {displayDisconnectedNodes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="duplicates" className="flex items-center gap-2">
              De-Duplication Of Nodes
              {displayGroups.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {displayGroups.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="disconnected" className="mt-4 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Orphan Nodes Deletion ({displayDisconnectedNodes.length} nodes per batch)
                </h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  This feature helps improve the accuracy of your knowledge graph by identifying and removing entities that are not connected to any other information. These "lonely" entities can be remnants of past analyses or errors in data processing. By removing them, we can create a cleaner and more efficient knowledge graph that leads to more relevant and informative responses.
                </p>
              </div>
              <div className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="font-semibold">Total Nodes:</span> {displayDisconnectedNodes.length}
              </div>
            </div>

            {displayDisconnectedNodes.length === 0 ? (
              <div className="text-center py-12">
                <Network className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                  No disconnected nodes found
                  {disconnectedNodes.length === 0 && (
                    <span className="ml-2 text-xs text-amber-600">(Demo data - upload documents to see real disconnected nodes)</span>
                  )}
                </p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className={`rounded-lg border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <Table>
                    <TableHeader className={darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedNodes.length === displayDisconnectedNodes.length && displayDisconnectedNodes.length > 0}
                            onCheckedChange={() => handleSelectAll(displayDisconnectedNodes.map(n => n.id))}
                          />
                        </TableHead>
                        <TableHead className={darkMode ? 'text-slate-300' : ''}>ID</TableHead>
                        <TableHead className={darkMode ? 'text-slate-300' : ''}>Labels</TableHead>
                        <TableHead className={darkMode ? 'text-slate-300' : ''}>Related Documents</TableHead>
                        <TableHead className={darkMode ? 'text-slate-300' : ''}>Connected Chunks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayDisconnectedNodes.slice(0, pageSize).map((node) => (
                        <TableRow key={node.id} className={darkMode ? 'border-slate-700' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedNodes.includes(node.id)}
                              onCheckedChange={() => handleSelectNode(node.id)}
                            />
                          </TableCell>
                          <TableCell className={`font-mono text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {node.id.substring(0, 20)}...
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2 items-center">
                              <Badge className={getNodeColor(node.type)}>
                                {node.type}
                              </Badge>
                              <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                                {node.label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span className={`text-sm truncate max-w-[200px] ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                {node.paper_title}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                            {node.source_passages?.length || 0}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Showing {Math.min(pageSize, displayDisconnectedNodes.length)} of {displayDisconnectedNodes.length} results
                    {disconnectedNodes.length === 0 && (
                      <span className="ml-2 text-xs text-amber-600">(Demo data - upload documents to see real disconnected nodes)</span>
                    )}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Show</span>
                      <Select value={pageSize.toString()} onValueChange={(val) => setPageSize(Number(val))}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleDeleteNodes}
                      disabled={selectedNodes.length === 0}
                      variant="destructive"
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Selected Nodes
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="duplicates" className="mt-4 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Refine Your Knowledge Graph: Merge Duplicate Entities
                </h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Identify and merge similar entries like "Apple" and "Apple Inc." to eliminate redundancy and improve the accuracy and clarity of your knowledge graph.
                </p>
              </div>
              <div className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="font-semibold">Total Groups:</span> {displayGroups.length}
              </div>
            </div>

            {displayGroups.length === 0 ? (
              <div className="text-center py-12">
                <GitMerge className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                  No duplicate nodes found
                  <br/>
                  <span className="text-xs text-amber-600">Upload and process documents to see real duplicates.</span>
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 pr-4">
                  {displayGroups.slice(0, duplicatePageSize).map((group, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`rounded-lg border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}
                    >
                      {/* Group Header */}
                      <div className={`p-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <Badge className={getNodeColor(group.nodes[0].type)}>
                            {group.nodes[0].type}
                          </Badge>
                          <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {group.label}
                          </span>
                          <Badge className="bg-amber-100 text-amber-800">
                            {group.count} similar nodes
                          </Badge>
                        </div>
                        <Button
                          onClick={() => handleMergeDuplicates(group)}
                          size="sm"
                          className="gap-2"
                        >
                          <GitMerge className="w-4 h-4" />
                          Merge Nodes
                        </Button>
                      </div>

                      {/* Duplicate Nodes Table */}
                      <Table>
                        <TableHeader className={darkMode ? 'bg-slate-900/50' : 'bg-slate-50/50'}>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox disabled />
                            </TableHead>
                            <TableHead className={darkMode ? 'text-slate-300' : ''}>ID</TableHead>
                            <TableHead className={darkMode ? 'text-slate-300' : ''}>Similar Nodes</TableHead>
                            <TableHead className={darkMode ? 'text-slate-300' : ''}>Related Documents</TableHead>
                            <TableHead className={darkMode ? 'text-slate-300' : ''}>Connected Chunks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.nodes.map((node, nodeIdx) => (
                            <TableRow key={nodeIdx} className={darkMode ? 'border-slate-700' : ''}>
                              <TableCell>
                                <Checkbox disabled checked={nodeIdx === 0} />
                              </TableCell>
                              <TableCell className={`font-mono text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                {node.id.substring(0, 20)}...
                              </TableCell>
                              <TableCell className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                                {node.label}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-slate-400" />
                                  <span className={`text-sm truncate max-w-[200px] ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {node.paper_title}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                                {node.source_passages?.length || 0}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Showing {Math.min(duplicatePageSize, displayGroups.length)} of {displayGroups.length} groups
                {duplicateGroups.length === 0 && (
                  <span className="ml-2 text-xs text-amber-600">(Demo data - upload documents to see real duplicates)</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Show</span>
                <Select value={duplicatePageSize.toString()} onValueChange={(val) => setDuplicatePageSize(Number(val))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
