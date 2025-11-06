import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Plus, X, Network, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function SchemaSelector({ 
  selectedFile, 
  selectedSchema, 
  onSchemaSelect, 
  onStartProcessing, 
  onBack,
  schemas 
}) {
  const [schemaType, setSchemaType] = useState("academic");
  const [customNodes, setCustomNodes] = useState([]);
  const [customRelationships, setCustomRelationships] = useState([]);
  const [newNode, setNewNode] = useState("");
  const [newRelationship, setNewRelationship] = useState("");

  const handleSchemaChange = (type) => {
    setSchemaType(type);
    if (type === "custom") {
      onSchemaSelect({
        name: "Custom Schema",
        nodes: customNodes,
        relationships: customRelationships
      });
    } else {
      onSchemaSelect(schemas[type]);
    }
  };

  const addCustomNode = () => {
    if (newNode.trim() && !customNodes.includes(newNode.trim())) {
      const updatedNodes = [...customNodes, newNode.trim()];
      setCustomNodes(updatedNodes);
      onSchemaSelect({
        name: "Custom Schema",
        nodes: updatedNodes,
        relationships: customRelationships
      });
      setNewNode("");
    }
  };

  const addCustomRelationship = () => {
    if (newRelationship.trim() && !customRelationships.includes(newRelationship.trim())) {
      const updatedRels = [...customRelationships, newRelationship.trim()];
      setCustomRelationships(updatedRels);
      onSchemaSelect({
        name: "Custom Schema",
        nodes: customNodes,
        relationships: updatedRels
      });
      setNewRelationship("");
    }
  };

  const removeCustomNode = (node) => {
    const updatedNodes = customNodes.filter(n => n !== node);
    setCustomNodes(updatedNodes);
    onSchemaSelect({
      name: "Custom Schema",
      nodes: updatedNodes,
      relationships: customRelationships
    });
  };

  const removeCustomRelationship = (rel) => {
    const updatedRels = customRelationships.filter(r => r !== rel);
    setCustomRelationships(updatedRels);
    onSchemaSelect({
      name: "Custom Schema",
      nodes: customNodes,
      relationships: updatedRels
    });
  };

  return (
    <div className="space-y-6">
      {/* File Summary */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{selectedFile.name}</h3>
              <p className="text-sm text-slate-600">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schema Selection */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Network className="w-5 h-5" />
            Select Knowledge Graph Schema
          </CardTitle>
          <p className="text-slate-600 text-sm">
            Choose the types of entities and relationships to extract from your document
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={schemaType} onValueChange={handleSchemaChange}>
            {Object.entries(schemas).filter(([key]) => key !== "custom").map(([key, schema]) => (
              <motion.div 
                key={key}
                whileHover={{ scale: 1.01 }}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={key} id={key} />
                  <Label htmlFor={key} className="font-medium text-slate-900 cursor-pointer">
                    {schema.name}
                  </Label>
                </div>
                <div className="ml-6 space-y-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Nodes:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {schema.nodes.slice(0, 8).map(node => (
                        <Badge key={node} variant="secondary" className="text-xs">
                          {node}
                        </Badge>
                      ))}
                      {schema.nodes.length > 8 && (
                        <Badge variant="outline" className="text-xs">
                          +{schema.nodes.length - 8}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Relationships:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {schema.relationships.slice(0, 6).map(rel => (
                        <Badge key={rel} variant="outline" className="text-xs">
                          {rel}
                        </Badge>
                      ))}
                      {schema.relationships.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{schema.relationships.length - 6}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Custom Schema Option */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="font-medium text-slate-900 cursor-pointer">
                  Custom Schema
                </Label>
              </div>
              
              {schemaType === "custom" && (
                <div className="ml-6 space-y-4">
                  {/* Custom Nodes */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Node Types</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Enter node type (e.g., Person, Location)"
                        value={newNode}
                        onChange={(e) => setNewNode(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomNode()}
                        className="flex-1"
                      />
                      <Button onClick={addCustomNode} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {customNodes.map(node => (
                        <Badge key={node} variant="secondary" className="text-xs">
                          {node}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer hover:text-red-600"
                            onClick={() => removeCustomNode(node)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Custom Relationships */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Relationship Types</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Enter relationship (e.g., WORKS_AT, LOCATED_IN)"
                        value={newRelationship}
                        onChange={(e) => setNewRelationship(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomRelationship()}
                        className="flex-1"
                      />
                      <Button onClick={addCustomRelationship} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {customRelationships.map(rel => (
                        <Badge key={rel} variant="outline" className="text-xs">
                          {rel}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer hover:text-red-600"
                            onClick={() => removeCustomRelationship(rel)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onStartProcessing}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          disabled={schemaType === "custom" && (customNodes.length === 0 || customRelationships.length === 0)}
        >
          Start Processing
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}