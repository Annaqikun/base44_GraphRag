
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FileText, Clock, CheckCircle, AlertCircle, Loader2, ExternalLink, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusIcons = {
  uploading: Loader2,
  uploaded: Clock,
  processing: Loader2,
  post_processing: Loader2,
  completed: CheckCircle,
  failed: AlertCircle
};

const statusColors = {
  uploading: "text-blue-600 bg-blue-100",
  uploaded: "text-purple-600 bg-purple-100",
  processing: "text-amber-600 bg-amber-100",
  post_processing: "text-purple-600 bg-purple-100",
  completed: "text-emerald-600 bg-emerald-100", 
  failed: "text-red-600 bg-red-100"
};

const PROCESSING_STAGES = {
  uploading: { label: "Uploading", progress: 20 },
  uploaded: { label: "Uploaded", progress: 40 },
  processing: { label: "Processing", progress: 60 },
  post_processing: { label: "Post-processing", progress: 80 },
  completed: { label: "Complete", progress: 100 },
  failed: { label: "Failed", progress: 0 }
};

export default function RecentActivity({ papers, darkMode = false, maxItems = 5 }) {
  const [selectedPaper, setSelectedPaper] = useState(null);

  const recentPapers = papers.slice(0, maxItems);

  const handlePaperClick = (paper) => {
    setSelectedPaper(paper);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className={`${darkMode ? 'bg-slate-800/70 border-slate-700/60' : 'bg-white/70 border-slate-200/60'} backdrop-blur-sm shadow-lg`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className={`${darkMode ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                <TrendingUp className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {papers.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentPapers.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FileText className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>No recent activity</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-3">
                  {recentPapers.map((paper, index) => {
                    const StatusIcon = statusIcons[paper.processing_status || 'uploading'];
                    const isProcessing = ['uploading', 'processing', 'post_processing'].includes(paper.processing_status);
                    const isFailed = paper.processing_status === 'failed';
                    const progress = paper.processing_progress || PROCESSING_STAGES[paper.processing_status]?.progress || 0;

                    return (
                      <motion.div
                        key={paper.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handlePaperClick(paper)}
                        className={`
                          p-4 rounded-lg transition-all cursor-pointer border
                          ${darkMode 
                            ? 'hover:bg-slate-700/50 border-slate-700 bg-slate-800/50' 
                            : 'hover:bg-slate-50/70 border-slate-200 bg-white/50'
                          }
                          ${isFailed ? 'border-red-300' : ''}
                        `}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-full flex-shrink-0 ${statusColors[paper.processing_status || 'uploading']}`}>
                            <StatusIcon className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm line-clamp-2 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                              {paper.title || paper.file_name}
                            </p>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                              {format(new Date(paper.created_date), "MMM d, h:mm a")}
                            </p>
                          </div>
                          <Badge 
                            variant="outline"
                            className={`text-xs flex-shrink-0 ${darkMode ? 'border-slate-600' : 'border-slate-200'}`}
                          >
                            {PROCESSING_STAGES[paper.processing_status]?.label || paper.processing_status}
                          </Badge>
                        </div>

                        {/* Progress Bar for Processing Items */}
                        {isProcessing && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                                {PROCESSING_STAGES[paper.processing_status]?.label}
                              </span>
                              <span className="font-semibold text-blue-600">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                          </div>
                        )}

                        {/* Error Message for Failed Items */}
                        {isFailed && (
                          <div className="mt-2 flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>Processing failed. Click to view details.</span>
                          </div>
                        )}

                        {/* Success Indicator */}
                        {paper.processing_status === 'completed' && (
                          <div className={`mt-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {paper.knowledge_graph?.nodes?.length || 0} nodes extracted
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedPaper} onOpenChange={() => setSelectedPaper(null)}>
        <DialogContent className={`sm:max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={`${darkMode ? 'text-white' : 'text-slate-900'} text-lg pr-8`}>
              {selectedPaper?.title || selectedPaper?.file_name}
            </DialogTitle>
            <DialogDescription className={`${darkMode ? 'text-slate-400' : 'text-slate-600'} text-sm`}>
              Processing details and status
            </DialogDescription>
          </DialogHeader>

          {selectedPaper && (
            <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between gap-4">
                  <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Current Status
                  </span>
                  <Badge className={`${statusColors[selectedPaper.processing_status || 'uploading']} text-xs whitespace-nowrap`}>
                    {PROCESSING_STAGES[selectedPaper.processing_status]?.label || selectedPaper.processing_status}
                  </Badge>
                </div>

                {/* Progress Bar */}
                {['uploading', 'processing', 'post_processing'].includes(selectedPaper.processing_status) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                        Processing Progress
                      </span>
                      <span className="font-semibold text-blue-600">
                        {selectedPaper.processing_progress || PROCESSING_STAGES[selectedPaper.processing_status]?.progress || 0}%
                      </span>
                    </div>
                    <Progress 
                      value={selectedPaper.processing_progress || PROCESSING_STAGES[selectedPaper.processing_status]?.progress || 0} 
                      className="h-2"
                    />
                  </div>
                )}

                {/* Processing Stages */}
                <div className="space-y-2">
                  <span className={`text-sm font-medium block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Processing Stages
                  </span>
                  <div className="space-y-2">
                    {Object.entries(PROCESSING_STAGES).filter(([key]) => key !== 'failed').map(([key, stage]) => {
                      const isCompleted = PROCESSING_STAGES[selectedPaper.processing_status]?.progress >= stage.progress;
                      const isCurrent = selectedPaper.processing_status === key;
                      
                      return (
                        <div 
                          key={key}
                          className={`flex items-center gap-3 p-2.5 rounded ${
                            isCurrent 
                              ? darkMode ? 'bg-blue-900/30' : 'bg-blue-50' 
                              : ''
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : isCurrent ? (
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${
                            isCurrent 
                              ? darkMode ? 'text-white font-medium' : 'text-slate-900 font-medium'
                              : darkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Error Details */}
                {selectedPaper.processing_status === 'failed' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-900 mb-1">Processing Failed</p>
                        <p className="text-xs text-red-700 break-words">
                          {selectedPaper.error_message || "An error occurred during processing. Please try uploading the file again."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Details */}
                {selectedPaper.processing_status === 'completed' && (
                  <div className={`p-3 rounded ${darkMode ? 'bg-emerald-900/20 border border-emerald-700' : 'bg-emerald-50 border border-emerald-200'}`}>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>
                          Processing Complete
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className={darkMode ? 'text-emerald-400' : 'text-emerald-700'}>Nodes:</span>
                            <span className={`ml-2 font-semibold ${darkMode ? 'text-white' : 'text-emerald-900'}`}>
                              {selectedPaper.knowledge_graph?.nodes?.length || 0}
                            </span>
                          </div>
                          <div>
                            <span className={darkMode ? 'text-emerald-400' : 'text-emerald-700'}>Relationships:</span>
                            <span className={`ml-2 font-semibold ${darkMode ? 'text-white' : 'text-emerald-900'}`}>
                              {selectedPaper.knowledge_graph?.relationships?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className={`space-y-2.5 pt-2 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <div className="flex justify-between items-center gap-4 text-sm">
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>File Type:</span>
                    <span className={`${darkMode ? 'text-white' : 'text-slate-900'} font-medium`}>
                      {selectedPaper.file_type?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-4 text-sm">
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>File Size:</span>
                    <span className={`${darkMode ? 'text-white' : 'text-slate-900'} font-medium`}>
                      {selectedPaper.file_size ? `${(selectedPaper.file_size / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-4 text-sm">
                    <span className={`${darkMode ? 'text-slate-400' : 'text-slate-600'} flex-shrink-0`}>Uploaded:</span>
                    <span className={`${darkMode ? 'text-white' : 'text-slate-900'} font-medium text-right`}>
                      {format(new Date(selectedPaper.created_date), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                {selectedPaper.processing_status === 'completed' && (
                  <div className="pt-2">
                    <Link to={createPageUrl("Graph")} className="block w-full">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Graph
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
