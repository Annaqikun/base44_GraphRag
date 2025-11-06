import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Network, FileText, MessageSquare, BarChart3, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function ProcessingResults({ 
  paper, 
  onStartNew, 
  onViewDashboard, 
  onViewGraph 
}) {
  const stats = {
    nodes: paper.extracted_graph?.nodes?.length || 0,
    relationships: paper.extracted_graph?.relationships?.length || 0,
    entities: paper.extracted_entities?.length || 0,
    processingTime: paper.metadata?.processing_time ? 
      Math.round((Date.now() - paper.metadata.processing_time) / 1000) : 0
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
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
          Your research paper has been successfully analyzed and the knowledge graph is ready for exploration.
        </p>
      </motion.div>

      {/* Results Summary */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Extraction Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.nodes}</div>
              <div className="text-sm text-slate-600">Nodes</div>
            </div>
            <div className="text-center p-4 bg-purple-50/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.relationships}</div>
              <div className="text-sm text-slate-600">Relationships</div>
            </div>
            <div className="text-center p-4 bg-emerald-50/50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">{stats.entities}</div>
              <div className="text-sm text-slate-600">Entities</div>
            </div>
            <div className="text-center p-4 bg-amber-50/50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{stats.processingTime}s</div>
              <div className="text-sm text-slate-600">Process Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paper Details */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Paper Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg mb-2">{paper.title}</h3>
            {paper.authors && paper.authors.length > 0 && (
              <p className="text-slate-600 mb-2">
                <strong>Authors:</strong> {paper.authors.join(", ")}
              </p>
            )}
            {paper.journal && (
              <p className="text-slate-600 mb-2">
                <strong>Journal:</strong> {paper.journal}
              </p>
            )}
            {paper.publication_year && (
              <p className="text-slate-600 mb-2">
                <strong>Year:</strong> {paper.publication_year}
              </p>
            )}
          </div>

          {paper.abstract && (
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Abstract</h4>
              <p className="text-slate-600 text-sm line-clamp-4">{paper.abstract}</p>
            </div>
          )}

          {paper.keywords && paper.keywords.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {paper.keywords.slice(0, 10).map((keyword, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {paper.keywords.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{paper.keywords.length - 10} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          onClick={onViewGraph}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12"
        >
          <Network className="w-4 h-4 mr-2" />
          Explore Graph
        </Button>
        <Button 
          onClick={onViewDashboard}
          variant="outline" 
          className="h-12"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          View Dashboard
        </Button>
        <Button 
          onClick={onStartNew}
          variant="outline" 
          className="h-12"
        >
          <Plus className="w-4 h-4 mr-2" />
          Process Another
        </Button>
      </div>
    </div>
  );
}