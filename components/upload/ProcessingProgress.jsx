import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const getStageIcon = (stageId, currentStageId) => {
  if (stageId === 'failed') return <AlertCircle className="w-5 h-5 text-red-600" />;
  const stagesOrder = ["uploading", "uploaded", "processing", "post_processing", "completed"];
  const currentIndex = stagesOrder.indexOf(currentStageId);
  const stageIndex = stagesOrder.indexOf(stageId);

  if (stageIndex < currentIndex) {
    return <CheckCircle className="w-5 h-5 text-emerald-600" />;
  }
  if (stageIndex === currentIndex) {
    return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
  }
  return <Clock className="w-5 h-5 text-slate-400" />;
};

export default function ProcessingProgress({ stages, processingFiles }) {
  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Processing Documents</CardTitle>
          <p className="text-slate-600 text-sm">Please wait while we analyze your files...</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence>
              {processingFiles.map((file, index) => (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border rounded-lg bg-slate-50/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-slate-800 truncate pr-4">{file.name}</p>
                    <div className="flex items-center gap-2 text-sm">
                      {getStageIcon(file.stage, file.stage)}
                      <span className="font-semibold">{file.stage === 'failed' ? 'Failed' : `${file.progress}%`}</span>
                    </div>
                  </div>
                  <Progress value={file.progress} className="h-2" />
                  {file.stage === 'failed' && (
                    <p className="text-xs text-red-600 mt-2">{file.error}</p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Processing Stages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            {stages.map((stage) => (
              <div key={stage.id} className="flex-1 text-center last:flex-none">
                  <div className="relative">
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200"></div>
                      <div className={`relative w-8 h-8 mx-auto rounded-full flex items-center justify-center z-10 transition-colors duration-300 ${
                          processingFiles.some(f => f.stage === stage.id || stages.findIndex(s => s.id === f.stage) > stages.findIndex(s => s.id === stage.id))
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                          {processingFiles.some(f => stages.findIndex(s => s.id === f.stage) > stages.findIndex(s => s.id === stage.id)) ? <CheckCircle className="w-5 h-5" /> : <Loader2 className={`w-5 h-5 ${processingFiles.some(f => f.stage === stage.id) ? 'animate-spin': 'hidden'}`} />}
                      </div>
                  </div>
                  <p className="text-xs mt-2 font-medium">{stage.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}