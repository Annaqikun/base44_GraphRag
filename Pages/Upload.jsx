import React, { useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Upload as UploadIcon, CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

import FileUploadZone from "../components/upload/FileUploadZone";
import ConfigurationPanel from "../Components/upload/ConfigurationPanel";

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

const PREDEFINED_SCHEMAS = [
  { 
    id: "general",
    name: "General Knowledge",
    nodeLabels: ["Person", "Organization", "Location", "Concept", "Event"],
    relationshipTypes: ["RELATED_TO", "PART_OF", "LOCATED_IN", "PARTICIPATED_IN"]
  },
  { 
    id: "research",
    name: "Research Paper",
    nodeLabels: ["Author", "Method", "Dataset", "Algorithm", "Concept", "Metric"],
    relationshipTypes: ["AUTHORED_BY", "USES_METHOD", "EVALUATES_ON", "RELATED_TO"]
  },
  { 
    id: "business",
    name: "Business Document",
    nodeLabels: ["Company", "Person", "Product", "Market", "Technology"],
    relationshipTypes: ["WORKS_FOR", "COMPETES_WITH", "PRODUCES", "PARTNERS_WITH"]
  }
];

const PROCESSING_STAGES = [
  { id: "uploading", label: "Uploading", progress: 20 },
  { id: "uploaded", label: "Uploaded", progress: 40 },
  { id: "processing", label: "Processing", progress: 60 },
  { id: "post_processing", label: "Post-processing", progress: 80 },
  { id: "completed", label: "Complete", progress: 100 }
];

export default function UploadPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Configuration, 2: Upload Files, 3: Processing
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedModel, setSelectedModel] = useState("gemini-pro");
  const [selectedSchema, setSelectedSchema] = useState("general");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStates, setProcessingStates] = useState({});
  const [error, setError] = useState(null);
  const [completedPapers, setCompletedPapers] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(file => SUPPORTED_TYPES[file.type]);
    
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      setError(null);
    } else {
      setError("No supported files found. Please upload PDF, DOCX, PPTX, TXT, MD, or image files.");
    }
  }, []);

  const handleFilesSelect = (files) => {
    if (files && files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      setError(null);
    }
  };

  const handleFileRemove = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getSchemaConfig = () => {
    return PREDEFINED_SCHEMAS.find(s => s.id === selectedSchema) || PREDEFINED_SCHEMAS[0];
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && selectedFiles.length > 0) {
      processFiles();
    }
  };

  const handleBackStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const processFile = async (file, index) => {
    const fileId = `file-${index}-${Date.now()}`;
    
    try {
      setProcessingStates(prev => ({ ...prev, [fileId]: { stage: "uploading", progress: 20, fileName: file.name } }));

      const paperData = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        file_name: file.name,
        file_type: SUPPORTED_TYPES[file.type],
        file_size: file.size,
        processing_status: "uploading",
        processing_progress: 20
      };

      const paper = await base44.entities.ResearchPaper.create(paperData);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setProcessingStates(prev => ({ ...prev, [fileId]: { stage: "uploaded", progress: 40, fileName: file.name } }));
      
      await base44.entities.ResearchPaper.update(paper.id, {
        file_url,
        processing_status: "uploaded",
        processing_progress: 40
      });

      setProcessingStates(prev => ({ ...prev, [fileId]: { stage: "processing", progress: 60, fileName: file.name } }));

      await base44.entities.ResearchPaper.update(paper.id, {
        processing_status: "processing",
        processing_progress: 60
      });

      const extractionResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            authors: { type: "array", items: { type: "string" } },
            abstract: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
            publication_year: { type: "number" },
            journal: { type: "string" },
            full_text: { type: "string" },
            pages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  page_number: { type: "number" },
                  content: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extractionResult.status !== "success") {
        throw new Error("Failed to extract document content");
      }

      setProcessingStates(prev => ({ ...prev, [fileId]: { stage: "post_processing", progress: 80, fileName: file.name } }));

      await base44.entities.ResearchPaper.update(paper.id, {
        processing_status: "post_processing",
        processing_progress: 80,
        extracted_content: extractionResult.output,
      });

      const schemaConfig = getSchemaConfig();

      const graphPrompt = `
Extract a comprehensive knowledge graph from this document using ${selectedModel}.

Document content: ${JSON.stringify(extractionResult.output?.full_text?.substring(0, 4000))}

Schema Guidelines:
- Node Labels: ${schemaConfig.nodeLabels.join(", ")}
- Relationship Types: ${schemaConfig.relationshipTypes.join(", ")}

Extract:
1. Key entities matching the schema node labels
2. Relationships between entities using the defined relationship types
3. Source text passages for each node and relationship

Return a detailed knowledge graph.
`;

      const graphResult = await base44.integrations.Core.InvokeLLM({
        prompt: graphPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            nodes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  label: { type: "string" },
                  type: { type: "string" },
                  properties: { type: "object" },
                  source_passages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        page: { type: "number" },
                        confidence: { type: "number" }
                      }
                    }
                  },
                  confidence: { type: "number" }
                }
              }
            },
            relationships: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  source_id: { type: "string" },
                  target_id: { type: "string" },
                  type: { type: "string" },
                  properties: { type: "object" },
                  source_passages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        page: { type: "number" },
                        confidence: { type: "number" }
                      }
                    }
                  },
                  confidence: { type: "number" }
                }
              }
            }
          }
        }
      });

      setProcessingStates(prev => ({ ...prev, [fileId]: { stage: "completed", progress: 100, fileName: file.name } }));

      const finalPaper = await base44.entities.ResearchPaper.update(paper.id, {
        ...extractionResult.output,
        knowledge_graph: graphResult,
        processing_status: "completed",
        processing_progress: 100,
        metadata: {
          llm_model: selectedModel,
          schema: selectedSchema,
          processing_time: Date.now()
        }
      });

      setCompletedPapers(prev => [...prev, finalPaper]);

    } catch (error) {
      console.error(`Processing error for ${file.name}:`, error);
      setProcessingStates(prev => ({ 
        ...prev, 
        [fileId]: { 
          stage: "failed", 
          progress: 0, 
          fileName: file.name,
          error: error.message 
        } 
      }));
    }
  };

  const processFiles = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setIsProcessing(true);
    setStep(3);
    setError(null);

    try {
      await Promise.all(
        selectedFiles.map((file, index) => processFile(file, index))
      );
    } catch (error) {
      console.error("Batch processing error:", error);
      setError("Some files failed to process");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSelectedFiles([]);
    setSelectedModel("gemini-pro");
    setSelectedSchema("general");
    setIsProcessing(false);
    setProcessingStates({});
    setError(null);
    setCompletedPapers([]);
  };

  const allFilesCompleted = Object.values(processingStates).every(state => 
    state.stage === "completed" || state.stage === "failed"
  );

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${darkMode ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6 sm:mb-8 pt-12 md:pt-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Upload & Generate Graph</h1>
            <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'} mt-1 text-sm sm:text-base`}>
              {step === 1 && "Step 1: Configure processing settings"}
              {step === 2 && "Step 2: Upload your documents"}
              {step === 3 && "Step 3: Processing documents"}
            </p>
          </div>
        </div>

        {/* Progress Steps Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className={`absolute top-5 left-0 right-0 h-0.5 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <div 
              className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            />
            
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step > stepNum 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                    : step === stepNum
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white ring-4 ring-blue-100'
                      : darkMode
                        ? 'bg-slate-700 text-slate-400'
                        : 'bg-slate-200 text-slate-500'
                }`}>
                  {step > stepNum ? <CheckCircle className="w-5 h-5" /> : stepNum}
                </div>
                <span className={`text-xs mt-2 ${
                  step >= stepNum 
                    ? darkMode ? 'text-white font-medium' : 'text-slate-900 font-medium'
                    : darkMode ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {stepNum === 1 && 'Configure'}
                  {stepNum === 2 && 'Upload'}
                  {stepNum === 3 && 'Process'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Configuration */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className={`${darkMode ? 'bg-slate-800/70 border-slate-700/60' : 'bg-white/70 border-slate-200/60'} backdrop-blur-sm shadow-lg`}>
                <CardHeader>
                  <CardTitle className={darkMode ? 'text-white' : 'text-slate-900'}>
                    Configure Processing Settings
                  </CardTitle>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Choose your AI model and knowledge graph schema before uploading
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ConfigurationPanel
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    selectedSchema={selectedSchema}
                    onSchemaChange={setSelectedSchema}
                    onGenerate={handleNextStep}
                    isLoading={false}
                    darkMode={darkMode}
                    buttonText="Continue to Upload"
                    buttonIcon={<ArrowRight className="w-4 h-4 ml-2" />}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: File Upload */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className={`${darkMode ? 'bg-slate-800/70 border-slate-700/60' : 'bg-white/70 border-slate-200/60'} backdrop-blur-sm shadow-lg`}>
                <CardHeader>
                  <CardTitle className={darkMode ? 'text-white' : 'text-slate-900'}>
                    Upload Documents
                  </CardTitle>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Select one or multiple files to process with your chosen settings
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Show Selected Configuration */}
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                    <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Selected Configuration:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        Model: {selectedModel}
                      </Badge>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        Schema: {getSchemaConfig().name}
                      </Badge>
                    </div>
                  </div>

                  <FileUploadZone
                    selectedFiles={selectedFiles}
                    onFilesSelect={handleFilesSelect}
                    onFileRemove={handleFileRemove}
                    dragActive={dragActive}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    darkMode={darkMode}
                  />

                  <div className="flex gap-3">
                    <Button 
                      onClick={handleBackStep}
                      variant="outline"
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Configuration
                    </Button>
                    <Button 
                      onClick={handleNextStep}
                      disabled={selectedFiles.length === 0}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      Process {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Processing */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className={`${darkMode ? 'bg-slate-800/70 border-slate-700/60' : 'bg-white/70 border-slate-200/60'} backdrop-blur-sm shadow-lg`}>
                <CardHeader>
                  <CardTitle className={darkMode ? 'text-white' : 'text-slate-900'}>
                    {isProcessing ? 'Processing Documents' : 'Processing Complete'}
                  </CardTitle>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {isProcessing 
                      ? `Processing ${selectedFiles.length} document${selectedFiles.length !== 1 ? 's' : ''}...`
                      : `Successfully processed ${completedPapers.length} of ${selectedFiles.length} document${selectedFiles.length !== 1 ? 's' : ''}`
                    }
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Processing Status for Each File */}
                  {Object.entries(processingStates).map(([fileId, state]) => (
                    <div key={fileId} className={`p-4 rounded-lg border ${darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            state.stage === 'completed' 
                              ? 'bg-emerald-100 text-emerald-700'
                              : state.stage === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}>
                            {state.stage === 'completed' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : state.stage === 'failed' ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                          </div>
                          <span className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {state.fileName}
                          </span>
                        </div>
                        <Badge variant="outline" className="ml-2 flex-shrink-0">
                          {PROCESSING_STAGES.find(s => s.id === state.stage)?.label || state.stage}
                        </Badge>
                      </div>
                      
                      {state.stage !== 'failed' && (
                        <div className="space-y-1">
                          <Progress value={state.progress} className="h-2" />
                          <p className="text-xs text-right font-semibold text-blue-600">{state.progress}%</p>
                        </div>
                      )}

                      {state.stage === 'failed' && state.error && (
                        <p className="text-xs text-red-600 mt-2">{state.error}</p>
                      )}
                    </div>
                  ))}

                  {/* Action Buttons */}
                  {allFilesCompleted && (
                    <div className="grid grid-cols-3 gap-3 pt-4">
                      <Button onClick={reset} variant="outline">
                        <UploadIcon className="w-4 h-4 mr-2" />
                        Upload More
                      </Button>
                      <Button onClick={() => navigate(createPageUrl("Graph"))} variant="outline">
                        Explore Graph
                      </Button>
                      <Button 
                        onClick={() => navigate(createPageUrl("Chat"))} 
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Start Chat
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}