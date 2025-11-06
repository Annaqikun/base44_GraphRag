import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FileText, 
    Users, 
    Calendar, 
    Tag, 
    Network,
    Eye,
    ExternalLink
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800", 
  completed: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800"
};

export default function PaperGrid({ papers, isLoading, searchQuery }) {
  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
        <CardHeader>
          <h3 className="text-xl font-semibold text-slate-900">Research Papers</h3>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="p-4 border border-slate-200 rounded-lg">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Research Papers</h3>
            <span className="text-sm text-slate-500">
              {searchQuery ? `${papers.length} results` : `${papers.length} total`}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {papers.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-2">
                  {searchQuery ? "No papers match your search" : "No papers uploaded yet"}
                </p>
                <p className="text-slate-400 text-sm">
                  {searchQuery ? "Try adjusting your search terms" : "Upload your first research paper to get started"}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {papers.map((paper, index) => (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <Card className="hover:shadow-lg transition-all duration-300 bg-white/50 border-slate-200/60">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 pr-4">
                            <h4 className="font-semibold text-slate-900 text-lg mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
                              {paper.title}
                            </h4>
                            {paper.authors && paper.authors.length > 0 && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                                <Users className="w-4 h-4" />
                                <span>{paper.authors.slice(0, 3).join(", ")}</span>
                                {paper.authors.length > 3 && (
                                  <span className="text-slate-400">+{paper.authors.length - 3} more</span>
                                )}
                              </div>
                            )}
                            {paper.abstract && (
                              <p className="text-slate-600 text-sm line-clamp-3 mb-3">
                                {paper.abstract}
                              </p>
                            )}
                          </div>
                          <Badge 
                            className={`${statusColors[paper.extraction_status || 'pending']} border-0 font-medium`}
                          >
                            {paper.extraction_status || 'pending'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            {paper.created_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{format(new Date(paper.created_date), "MMM d, yyyy")}</span>
                              </div>
                            )}
                            {paper.extracted_entities && paper.extracted_entities.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Network className="w-4 h-4" />
                                <span>{paper.extracted_entities.length} entities</span>
                              </div>
                            )}
                            {paper.keywords && paper.keywords.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Tag className="w-4 h-4" />
                                <span>{paper.keywords.length} keywords</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {paper.file_url && (
                              <Button size="sm" variant="ghost" asChild>
                                <a href={paper.file_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>

                        {paper.keywords && paper.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                            {paper.keywords.slice(0, 5).map((keyword, i) => (
                              <Badge key={i} variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                {keyword}
                              </Badge>
                            ))}
                            {paper.keywords.length > 5 && (
                              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-400">
                                +{paper.keywords.length - 5}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}