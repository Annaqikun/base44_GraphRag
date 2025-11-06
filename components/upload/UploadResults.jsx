import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, AlertCircle, FileText, Plus, BarChart3, Brain, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadResults({ completedPapers, processingFiles, onStartNewUpload, onViewDashboard, onStartChat }) {
  const failedFiles = processingFiles.filter(f => f.stage === "failed");

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Processing Complete!
        </h2>
        <p className="text-slate-600">
          Successfully processed {completedPapers.length} file(s). {failedFiles.length > 0 ? `${failedFiles.length} file(s) failed.` : ''}
        </p>
      </motion.div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button onClick={onStartNewUpload} variant="outline" className="h-12">
          <Plus className="w-4 h-4 mr-2" />
          Process Another
        </Button>
        <Button onClick={onViewDashboard} variant="outline" className="h-12">
          <BarChart3 className="w-4 h-4 mr-2" />
          View Dashboard
        </Button>
        <Button onClick={onStartChat} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12">
          <Brain className="w-4 h-4 mr-2" />
          Start Chatting
        </Button>
      </div>

      {/* Completed Papers */}
      {completedPapers.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Successfully Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3 pr-4">
                <AnimatePresence>
                  {completedPapers.map((paper, index) => (
                    <motion.div
                      key={paper.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-900">{paper.title}</p>
                          <p className="text-sm text-slate-500">
                            {paper.authors ? paper.authors.slice(0, 2).join(', ') : 'No authors listed'}
                          </p>
                        </div>
                      </div>
                      <a href={paper.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon">
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Failed Files */}
      {failedFiles.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Failed Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3 pr-4">
                {failedFiles.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg border border-red-200 bg-red-50/50"
                  >
                    <p className="font-medium text-red-900">{file.name}</p>
                    <p className="text-sm text-red-700 mt-1">
                      <strong>Reason:</strong> {file.error || "An unknown error occurred."}
                    </p>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}