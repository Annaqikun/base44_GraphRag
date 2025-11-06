import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { ChatSession, ResearchPaper } from "@/entities/all";

export default function ImportExportPanel({ 
  currentSession, 
  papers, 
  onClose, 
  onImportSuccess 
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = React.useRef(null);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const exportData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        session: currentSession,
        papers: papers.map(paper => ({
          ...paper,
          // Include only essential data to reduce file size
          extracted_content: {
            full_text: paper.extracted_content?.full_text?.substring(0, 10000) // Limit text length
          }
        })),
        metadata: {
          total_papers: papers.length,
          total_messages: currentSession?.messages?.length || 0,
          export_date: new Date().toISOString()
        }
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `graphrag-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setImportStatus({
        type: "success",
        message: "Dataset exported successfully!"
      });
    } catch (error) {
      console.error("Export error:", error);
      setImportStatus({
        type: "error",
        message: "Failed to export dataset. Please try again."
      });
    }
    
    setIsExporting(false);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setImportStatus({
        type: "error",
        message: "Please select a valid JSON file."
      });
      return;
    }

    setIsImporting(true);
    setImportStatus(null);

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate import data structure
      if (!importData.version || !importData.session || !importData.papers) {
        throw new Error("Invalid file format. Please select a valid GraphRAG export file.");
      }

      // Create new session
      const newSession = await ChatSession.create({
        title: `Imported - ${importData.session.title}`,
        messages: importData.session.messages || [],
        active: true,
        paper_ids: []
      });

      // Import papers
      const importedPapers = [];
      for (const paperData of importData.papers) {
        try {
          const newPaper = await ResearchPaper.create({
            ...paperData,
            id: undefined, // Let system generate new ID
            created_date: undefined,
            updated_date: undefined
          });
          importedPapers.push(newPaper);
        } catch (error) {
          console.warn("Failed to import paper:", paperData.title, error);
        }
      }

      // Update session with paper IDs
      await ChatSession.update(newSession.id, {
        paper_ids: importedPapers.map(p => p.id)
      });

      setImportStatus({
        type: "success",
        message: `Successfully imported ${importedPapers.length} papers and ${importData.session.messages?.length || 0} messages!`
      });

      // Notify parent component
      setTimeout(() => {
        onImportSuccess({
          session: { ...newSession, paper_ids: importedPapers.map(p => p.id) },
          papers: importedPapers
        });
      }, 1500);

    } catch (error) {
      console.error("Import error:", error);
      setImportStatus({
        type: "error",
        message: error.message || "Failed to import dataset. Please check the file format."
      });
    }

    setIsImporting(false);
    // Clear file input
    event.target.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-white border-l border-slate-200 shadow-xl z-50"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-slate-900">Import/Export</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-6">
          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Data
              </CardTitle>
              <p className="text-sm text-slate-600">
                Download your current session and documents as a JSON file
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Documents:</span>
                  <span className="font-medium">{papers.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Messages:</span>
                  <span className="font-medium">{currentSession?.messages?.length || 0}</span>
                </div>
                <Button 
                  onClick={handleExport}
                  disabled={isExporting || papers.length === 0}
                  className="w-full"
                >
                  {isExporting ? (
                    <>Exporting...</>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export Dataset
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Data
              </CardTitle>
              <p className="text-sm text-slate-600">
                Upload a previously exported JSON file to start a new session
              </p>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                variant="outline"
                className="w-full"
              >
                {isImporting ? (
                  <>Importing...</>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Select JSON File
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                Only JSON files exported from GraphRAG are supported
              </p>
            </CardContent>
          </Card>

          {/* Status Messages */}
          {importStatus && (
            <Alert variant={importStatus.type === "error" ? "destructive" : "default"}>
              {importStatus.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{importStatus.message}</AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <Card className="bg-slate-50">
            <CardHeader>
              <CardTitle className="text-base">How it works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p><strong>Export:</strong> Downloads all your documents, knowledge graphs, and chat history as a single JSON file.</p>
              <p><strong>Import:</strong> Uploads a previously exported file and creates a new session with the imported data.</p>
              <p className="text-xs text-slate-500">
                Note: Large files may take longer to process. File URLs may need to be re-uploaded after import.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}