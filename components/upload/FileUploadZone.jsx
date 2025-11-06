import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload as UploadIcon, FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SUPPORTED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif'
};

const fileTypeColors = {
  pdf: "bg-red-100 text-red-700",
  docx: "bg-blue-100 text-blue-700",
  pptx: "bg-orange-100 text-orange-700",
  txt: "bg-gray-100 text-gray-700",
  md: "bg-green-100 text-green-700",
  jpg: "bg-purple-100 text-purple-700",
  png: "bg-purple-100 text-purple-700",
  gif: "bg-pink-100 text-pink-700"
};

export default function FileUploadZone({ 
  selectedFiles = [], 
  onFilesSelect, 
  onFileRemove, 
  dragActive, 
  onDragEnter, 
  onDragLeave, 
  onDragOver, 
  onDrop,
  darkMode = false 
}) {
  const fileInputRef = React.useRef(null);
  
  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  const hasFiles = selectedFiles.length > 0;

  return (
    <motion.div
      layout
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="space-y-3"
    >
      {/* Upload Zone */}
      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl text-center transition-all cursor-pointer
          ${hasFiles ? 'p-6' : 'p-8 sm:p-12'}
          ${dragActive 
            ? "border-blue-400 bg-blue-50/50" 
            : darkMode
              ? "border-slate-600 hover:border-slate-500 hover:bg-slate-700/30"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={Object.keys(SUPPORTED_TYPES).join(',')}
          onChange={(e) => onFilesSelect(Array.from(e.target.files))}
          className="hidden"
        />
        
        <AnimatePresence mode="wait">
          {hasFiles ? (
            <motion.div
              key="files-selected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                </p>
              </div>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Click or drag to add more files
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="no-files"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <UploadIcon className={`w-12 h-12 mx-auto ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              </motion.div>
              <div>
                <p className={`text-lg font-semibold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Drag & Drop or browse
                </p>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Upload multiple documents at once
                </p>
              </div>
              <div className="flex justify-center flex-wrap gap-2">
                {Object.values(SUPPORTED_TYPES).map(ext => (
                  <Badge key={ext} variant="secondary" className="text-xs">
                    .{ext}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Files List */}
      {hasFiles && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          {selectedFiles.map((file, index) => (
            <motion.div
              key={`${file.name}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                darkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                fileTypeColors[getFileExtension(file.name)] || (darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700')
              }`}>
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {file.name}
                </p>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {getFileExtension(file.name).toUpperCase()}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileRemove(index);
                }}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}