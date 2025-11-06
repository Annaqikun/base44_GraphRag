
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    FileText,
    CheckCircle,
    Clock,
    AlertCircle,
    Network,
    HardDrive,
    Sparkles,
    Eye,
    ChevronRight,
    Calendar,
    Search,
    CheckSquare,
    Square
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const statusConfig = {
  uploading: { icon: Clock, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", label: "Uploading" },
  uploaded: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "Uploaded" },
  processing: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "Processing" },
  post_processing: { icon: Clock, color: "text-purple-600", bg: "bg-purple-50 border-purple-200", label: "Post-Processing" },
  completed: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "Completed" },
  failed: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Failed" }
};

const fileTypeColors = {
  pdf: "bg-red-100 text-red-700",
  docx: "bg-blue-100 text-blue-700",
  pptx: "bg-orange-100 text-orange-700",
  txt: "bg-gray-100 text-gray-700",
  md: "bg-green-100 text-green-700",
  jpg: "bg-purple-100 text-purple-700",
  png: "bg-purple-100 text-purple-700"
};

export default function DocumentsList({
  papers,
  selectedPaperId,
  selectedPaperIds = [],
  onSelectPaper,
  multiSelect = false,
  darkMode = false
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter papers based on search query
  const filteredPapers = papers.filter(paper =>
    paper.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.authors?.some(author => author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handlePaperClick = (paperId, e) => {
    if (multiSelect) {
      // Don't toggle if clicking the checkbox itself
      if (e.target.type === 'checkbox') return;
      onSelectPaper(paperId);
    } else {
      onSelectPaper(paperId);
    }
  };

  const isSelected = (paperId) => {
    if (multiSelect) {
      return selectedPaperIds.includes(paperId);
    }
    return selectedPaperId === paperId;
  };

  const selectAll = () => {
    const allIds = filteredPapers.filter(p => p.processing_status === 'completed').map(p => p.id);
    onSelectPaper(allIds);
  };

  const deselectAll = () => {
    onSelectPaper([]);
  };

  const selectedCount = multiSelect ? selectedPaperIds.length : (selectedPaperId ? 1 : 0);

  return (
    <Card className={`${darkMode ? 'bg-slate-800/70 border-slate-700/60' : 'bg-white/70 border-slate-200/60'} backdrop-blur-sm shadow-lg`}>
      <CardHeader className={`border-b ${darkMode ? 'border-slate-700/60' : 'border-slate-200/60'} pb-4`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <CardTitle className={`${darkMode ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
              <FileText className="w-5 h-5" />
              Documents ({filteredPapers.length})
              {multiSelect && selectedCount > 0 && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  {selectedCount} selected
                </Badge>
              )}
            </CardTitle>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {multiSelect
                ? "Select multiple documents to view combined knowledge graph"
                : "Click on a document to view its knowledge graph"
              }
            </p>
          </div>
          {multiSelect && filteredPapers.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="text-xs"
              >
                <CheckSquare className="w-3 h-3 mr-1" />
                Select All
              </Button>
              {selectedCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAll}
                  className="text-xs"
                >
                  <Square className="w-3 h-3 mr-1" />
                  Deselect All
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${darkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400' : ''} pl-10`}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredPapers.length === 0 ? (
          <div className="text-center py-12">
            <FileText className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
            <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
              {searchQuery ? "No documents match your search" : "No documents processed yet"}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {searchQuery ? "Try a different search term" : "Upload a paper to get started"}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="p-4 space-y-3">
              {filteredPapers.map((paper, index) => {
                const StatusIcon = statusConfig[paper.processing_status]?.icon || Clock;
                const selected = isSelected(paper.id);
                const nodeCount = paper.knowledge_graph?.nodes?.length || 0;
                const relationCount = paper.knowledge_graph?.relationships?.length || 0;
                const canViewGraph = paper.processing_status === 'completed' && nodeCount > 0;

                return (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={(e) => handlePaperClick(paper.id, e)}
                    className={`
                      relative rounded-lg border-2 transition-all duration-200 cursor-pointer
                      ${selected
                        ? darkMode
                          ? 'border-blue-500 bg-blue-900/30 shadow-md'
                          : 'border-blue-500 bg-blue-50/50 shadow-md'
                        : darkMode
                          ? 'border-slate-700 bg-slate-800 hover:border-slate-600 hover:shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }
                    `}
                  >
                    {/* Multi-select Checkbox */}
                    {multiSelect && (
                      <div className="absolute top-3 left-3 z-10">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => onSelectPaper(paper.id)}
                          className="h-5 w-5"
                        />
                      </div>
                    )}

                    {/* Selected Indicator */}
                    {selected && canViewGraph && !multiSelect && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        <Eye className="w-3 h-3" />
                        <span>Viewing</span>
                      </div>
                    )}

                    <div className={`p-4 ${multiSelect ? 'pl-12' : ''}`}>
                      {/* Header Row */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* File Icon */}
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${fileTypeColors[paper.file_type] || (darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700')}`}>
                          <FileText className="w-6 h-6" />
                        </div>

                        {/* Title & Status */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold mb-1 leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {paper.title || paper.file_name}
                          </h4>
                          {paper.authors && paper.authors.length > 0 && (
                            <p className={`text-sm truncate ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              {paper.authors.slice(0, 2).join(", ")}
                              {paper.authors.length > 2 && ` +${paper.authors.length - 2} more`}
                            </p>
                          )}
                        </div>

                        {/* Status Badge */}
                        <Badge className={`${statusConfig[paper.processing_status]?.bg} ${statusConfig[paper.processing_status]?.color} border flex items-center gap-1.5 px-2.5 py-1`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{statusConfig[paper.processing_status]?.label}</span>
                        </Badge>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm pl-15">
                        <div className="flex items-center gap-2">
                          <span className={`${darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Type:</span>
                          <Badge variant="outline" className="text-xs font-medium">
                            {paper.file_type?.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`${darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Size:</span>
                          <span className={`${darkMode ? 'text-white' : 'text-slate-900'} font-medium`}>
                            {paper.file_size ? `${(paper.file_size / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                          <span className={`${darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Source:</span>
                          <span className={darkMode ? 'text-white' : 'text-slate-900'}>Local File</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          <span className={`${darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium`}>AI Model:</span>
                          <span className={darkMode ? 'text-white' : 'text-slate-900'}>{paper.metadata?.llm_model || 'Gemini Pro'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Network className="w-3.5 h-3.5 text-blue-500" />
                          <span className={`${darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Nodes:</span>
                          <span className={`${darkMode ? 'text-white' : 'text-slate-900'} font-semibold`}>{nodeCount}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Network className="w-3.5 h-3.5 text-purple-500" />
                          <span className={`${darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Relationships:</span>
                          <span className={`${darkMode ? 'text-white' : 'text-slate-900'} font-semibold`}>{relationCount}</span>
                        </div>

                        <div className="flex items-center gap-2 col-span-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={`${darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Uploaded:</span>
                          <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                            {paper.created_date ? format(new Date(paper.created_date), "MMM d, yyyy 'at' h:mm a") : 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar (if processing) */}
                      {['uploading', 'processing', 'post_processing'].includes(paper.processing_status) && (
                        <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} pl-15`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Processing Progress</span>
                            <span className="text-xs font-semibold text-blue-600">{paper.processing_progress || 0}%</span>
                          </div>
                          <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                              style={{ width: `${paper.processing_progress || 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Click to View Indicator */}
                      {canViewGraph && !selected && !multiSelect && (
                        <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} pl-15 flex items-center gap-2 text-blue-600 text-sm font-medium`}>
                          <Eye className="w-4 h-4" />
                          <span>Click to view knowledge graph</span>
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
