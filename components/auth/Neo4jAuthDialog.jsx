import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";

export default function Neo4jAuthDialog({ isOpen, onSuccess }) {
  const [formData, setFormData] = useState({
    protocol: "neo4j",
    uri: "127.0.0.17687",
    database: "neo4j",
    username: "neo4j",
    password: ""
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    if (!formData.uri || !formData.username || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Create connection record
      const connection = await base44.entities.Neo4jConnection.create({
        ...formData,
        connection_status: "connected",
        last_connected: new Date().toISOString(),
        is_active: true
      });

      // Store in localStorage for session persistence
      localStorage.setItem('neo4j_connection_id', connection.id);
      
      onSuccess(connection);
    } catch (err) {
      setError(err.message || "Failed to connect to Neo4j. Please check your credentials.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Connect to Neo4j</DialogTitle>
          <DialogDescription>
            <span>Don't have a Neo4j instance? </span>
            <a 
              href="https://neo4j.com/cloud/aura-free/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Start for free today
              <ExternalLink className="w-3 h-3" />
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Protocol</Label>
            <Select 
              value={formData.protocol} 
              onValueChange={(value) => setFormData({...formData, protocol: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neo4j">neo4j</SelectItem>
                <SelectItem value="neo4j+s">neo4j+s</SelectItem>
                <SelectItem value="bolt">bolt</SelectItem>
                <SelectItem value="bolt+s">bolt+s</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uri">URI</Label>
            <Input
              id="uri"
              placeholder="127.0.0.17687"
              value={formData.uri}
              onChange={(e) => setFormData({...formData, uri: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="database">Database</Label>
            <Input
              id="database"
              placeholder="neo4j"
              value={formData.database}
              onChange={(e) => setFormData({...formData, database: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="neo4j"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="******"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}