import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { FileText, Plus, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface CredentialingNotesProps {
  therapistId: string;
  notes: any[];
}

export default function CredentialingNotes({
  therapistId,
  notes,
}: CredentialingNotesProps) {
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [isInternal, setIsInternal] = useState(true);
  const { toast } = useToast();

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: (data: { note: string; noteType: string; isInternal: boolean }) =>
      apiRequest("POST", `/api/admin/credentialing/${therapistId}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/credentialing/${therapistId}`] });
      toast({
        title: "Note added",
        description: "Credentialing note has been saved",
      });
      setNewNote("");
      setNoteType("general");
      setIsInternal(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add note",
        variant: "destructive",
      });
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast({
        title: "Note required",
        description: "Please enter a note before saving",
        variant: "destructive",
      });
      return;
    }

    addNoteMutation.mutate({
      note: newNote,
      noteType,
      isInternal,
    });
  };

  const getNoteTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      general: "bg-gray-500",
      concern: "bg-orange-500",
      follow_up: "bg-blue-500",
      decision: "bg-green-500",
    };
    const color = colors[type] || "bg-gray-500";
    return <Badge className={color}>{type.replace(/_/g, " ")}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Add New Note */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Note</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Note Type</label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="concern">Concern</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="decision">Decision</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Note</label>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter credentialing note..."
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isInternal"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="isInternal" className="text-sm text-muted-foreground">
                Internal note (not shared with provider)
              </label>
            </div>

            <Button
              onClick={handleAddNote}
              disabled={addNoteMutation.isPending}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Note History ({notes?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!notes || notes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">No notes yet</p>
              <p className="text-sm mt-2">Add notes to track credentialing progress</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getNoteTypeBadge(note.noteType)}
                      {note.isInternal && (
                        <Badge variant="secondary" className="text-xs">
                          Internal
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
