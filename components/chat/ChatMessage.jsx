import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, User, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

import CitationPopover from "./CitationPopover";

export default function ChatMessage({ message, index, darkMode = false }) {
  const isUser = message.role === "user";

  // Parse citations in the content
  const parseMessageWithCitations = (content, citations) => {
    if (!citations || citations.length === 0) {
      return <span>{content}</span>;
    }

    let parsedContent = content;
    const parts = [];
    let lastIndex = 0;

    // Find citation patterns like [Citation 1], [1], etc.
    const citationRegex = /\[(?:Citation\s*)?(\d+)\]/gi;
    let match;

    while ((match = citationRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const citationNumber = match[1];
      const citation = citations.find(c => c.id === citationNumber);

      if (citation) {
        // Add text before citation
        if (match.index > lastIndex) {
          parts.push(
            <span key={`text-${lastIndex}`}>
              {content.substring(lastIndex, match.index)}
            </span>
          );
        }

        // Add citation component
        parts.push(
          <CitationPopover key={`citation-${citationNumber}`} citation={citation}>
            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium text-sm"
            >
              {fullMatch}
            </Button>
          </CitationPopover>
        );

        lastIndex = match.index + fullMatch.length;
      }
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? <>{parts}</> : <span>{content}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-3xl ${isUser ? 'order-first' : ''}`}>
        <div
          className={`
            p-4 rounded-2xl shadow-sm
            ${isUser 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white ml-auto' 
              : (darkMode 
                ? 'bg-slate-800/80 border border-slate-700/60 text-slate-200' 
                : 'bg-white/70 backdrop-blur-sm border border-slate-200/60 text-slate-900')
            }
          `}
        >
          <div className="space-y-2">
            {isUser ? (
              <p>{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div>
                  {parseMessageWithCitations(message.content, message.citations)}
                </div>
              </div>
            )}

            {/* Citations summary for assistant messages */}
            {!isUser && message.citations && message.citations.length > 0 && (
              <div className={`pt-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sources:</p>
                <div className="flex flex-wrap gap-2">
                  {message.citations.map((citation, i) => (
                    <Badge 
                      key={i} 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {citation.paper_title?.substring(0, 20)}...
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`flex items-center gap-2 mt-2 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'} ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span>{format(new Date(message.timestamp), "h:mm a")}</span>
          {!isUser && message.citations && (
            <span>• {message.citations.length} source{message.citations.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {isUser && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
          <User className={`w-4 h-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
        </div>
      )}
    </motion.div>
  );
}