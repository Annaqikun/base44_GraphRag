import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Network, FileText, Wand2 } from "lucide-react";
import { motion } from "framer-motion";

const LLM_MODELS = [
  { id: "gemini-pro", name: "Gemini Pro", provider: "Google" },
  { id: "gemini-flash", name: "Gemini Flash", provider: "Google" },
  { id: "gpt-4", name: "GPT-4", provider: "OpenAI" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI" },
];

const PREDEFINED_SCHEMAS = [
  { 
    id: "general",
    name: "General Knowledge",
    description: "Broad extraction for general documents",
    nodeLabels: ["Person", "Organization", "Location", "Concept", "Event"],
    relationshipTypes: ["RELATED_TO", "PART_OF", "LOCATED_IN", "PARTICIPATED_IN"]
  },
  { 
    id: "research",
    name: "Research Paper",
    description: "Optimized for academic research",
    nodeLabels: ["Author", "Method", "Dataset", "Algorithm", "Concept", "Metric"],
    relationshipTypes: ["AUTHORED_BY", "USES_METHOD", "EVALUATES_ON", "RELATED_TO"]
  },
  { 
    id: "business",
    name: "Business Document",
    description: "For business and enterprise documents",
    nodeLabels: ["Company", "Person", "Product", "Market", "Technology"],
    relationshipTypes: ["WORKS_FOR", "COMPETES_WITH", "PRODUCES", "PARTNERS_WITH"]
  }
];

export default function ConfigurationPanel({ 
  selectedModel, 
  onModelChange, 
  selectedSchema, 
  onSchemaChange,
  onGenerate,
  isLoading,
  darkMode = false,
  buttonText = "Generate Knowledge Graph",
  buttonIcon = null
}) {
  const getSchemaConfig = () => {
    return PREDEFINED_SCHEMAS.find(s => s.id === selectedSchema) || PREDEFINED_SCHEMAS[0];
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="space-y-6"
    >
      {/* LLM Model Selection */}
      <div className="space-y-3">
        <label className={`text-sm font-medium flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          <Sparkles className="w-4 h-4" />
          AI Model
        </label>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={darkMode ? "dark" : ""}>
            {LLM_MODELS.map(model => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{model.name}</span>
                  <Badge variant="outline" className="text-xs ml-2">
                    {model.provider}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Schema Selection */}
      <div className="space-y-3">
        <label className={`text-sm font-medium flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          <Network className="w-4 h-4" />
          Knowledge Graph Schema
        </label>
        <Select value={selectedSchema} onValueChange={onSchemaChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={darkMode ? "dark" : ""}>
            {PREDEFINED_SCHEMAS.map(schema => (
              <SelectItem key={schema.id} value={schema.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{schema.name}</span>
                  <span className="text-xs text-slate-500">{schema.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Show Schema Details */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
          <div className="space-y-3 text-sm">
            <div>
              <p className={`font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Node Labels:</p>
              <div className="flex flex-wrap gap-2">
                {getSchemaConfig().nodeLabels.map(label => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className={`font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Relationship Types:</p>
              <div className="flex flex-wrap gap-2">
                {getSchemaConfig().relationshipTypes.map(type => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Schema Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1"
            onClick={() => {/* TODO: Implement use existing schema */}}
          >
            <FileText className="w-4 h-4 mr-2" />
            Use Existing Schema
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1"
            onClick={() => {/* TODO: Implement extract schema from text */}}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Extract From Text
          </Button>
        </div>
      </div>

      {/* Generate Button - At Bottom */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button 
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {buttonIcon && <span className="mr-2">{buttonIcon.props.children}</span>}
          {!buttonIcon && <Sparkles className="w-4 h-4 mr-2" />}
          {buttonText}
        </Button>
      </div>
    </motion.div>
  );
}