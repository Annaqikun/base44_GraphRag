import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const NODE_TYPES = [
  "Person", "Concept", "Method", "Location", "Organization", 
  "Algorithm", "Dataset", "Technology", "Event", "Other"
];

export default function NodeEditDialog({ node, onSave, onClose }) {
  const [editedNode, setEditedNode] = useState({
    ...node,
    type: node.type || "Concept"
  });

  const handleSave = () => {
    onSave(editedNode);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Node</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={editedNode.label}
              onChange={(e) => setEditedNode(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Node label"
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select 
              value={editedNode.type} 
              onValueChange={(value) => setEditedNode(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {NODE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={editedNode.properties?.description || ""}
              onChange={(e) => setEditedNode(prev => ({
                ...prev,
                properties: { ...prev.properties, description: e.target.value }
              }))}
              placeholder="Additional description"
              rows={3}
            />
          </div>

          <div>
            <Label>Confidence</Label>
            <div className="flex items-center gap-2">
              <Input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={editedNode.confidence || 0.5}
                onChange={(e) => setEditedNode(prev => ({ ...prev, confidence: parseFloat(e.target.value) }))}
                className="flex-1"
              />
              <span className="text-sm text-slate-600 w-12">
                {Math.round((editedNode.confidence || 0.5) * 100)}%
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}