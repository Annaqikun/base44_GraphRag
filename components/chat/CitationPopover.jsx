import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { FileText, ExternalLink, Star } from "lucide-react";

export default function CitationPopover({ citation, children }) {
  const handleOpenSource = () => {
    if (citation.file_url) {
      window.open(citation.file_url, '_blank');
    }
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-96 p-4" side="top">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              <span className="font-semibold text-slate-900 text-sm">
                {citation.paper_title}
              </span>
            </div>
            {citation.confidence && (
              <Badge variant="secondary" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                {Math.round(citation.confidence * 100)}%
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <p className="text-sm text-slate-700 leading-relaxed">
              "{citation.text_snippet}"
            </p>
            
            {citation.page && (
              <p className="text-xs text-slate-500">
                Page {citation.page}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleOpenSource}
              className="text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Open Source
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}