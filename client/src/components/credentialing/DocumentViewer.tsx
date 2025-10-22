import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface DocumentViewerProps {
  therapistId: string;
}

export default function DocumentViewer({ therapistId }: DocumentViewerProps) {
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const { toast } = useToast();

  // Fetch documents
  const { data: documents, isLoading } = useQuery<any[]>({
    queryKey: [`/api/admin/credentialing/${therapistId}/documents`],
  });

  // Verify document mutation
  const verifyMutation = useMutation({
    mutationFn: (data: { documentId: string; verified: boolean; notes: string }) =>
      apiRequest("POST", `/api/admin/credentialing/documents/${data.documentId}/verify`, {
        verified: data.verified,
        notes: data.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/admin/credentialing/${therapistId}/documents`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/admin/credentialing/${therapistId}`],
      });
      toast({
        title: "Document verified",
        description: "Document has been marked as verified",
      });
      setVerifyDialogOpen(false);
      setSelectedDocument(null);
      setVerificationNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to verify document",
        variant: "destructive",
      });
    },
  });

  const handleDownload = (documentId: string, fileName: string) => {
    window.open(`/api/credentialing/documents/${documentId}/download`, "_blank");
  };

  const handleVerify = (document: any) => {
    setSelectedDocument(document);
    setVerificationNotes(document.notes || "");
    setVerifyDialogOpen(true);
  };

  const handleConfirmVerify = (verified: boolean) => {
    if (!selectedDocument) return;

    verifyMutation.mutate({
      documentId: selectedDocument.id,
      verified,
      notes: verificationNotes,
    });
  };

  const getDocumentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      license: "bg-blue-500",
      transcript: "bg-purple-500",
      diploma: "bg-green-500",
      government_id: "bg-yellow-500",
      liability_insurance: "bg-orange-500",
      dea_certificate: "bg-red-500",
      board_certification: "bg-indigo-500",
    };
    const color = colors[type] || "bg-gray-500";
    return <Badge className={color}>{type.replace(/_/g, " ")}</Badge>;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) {
      return <FileText className="h-4 w-4 text-red-500" />;
    }
    if (mimeType.includes("image")) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">No documents uploaded</p>
            <p className="text-sm mt-2">Provider has not uploaded any credentialing documents yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const verifiedCount = documents.filter(d => d.verified).length;
  const totalCount = documents.length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Uploaded Documents ({verifiedCount}/{totalCount} verified)</CardTitle>
            <Badge variant={verifiedCount === totalCount ? "default" : "secondary"}>
              {verifiedCount === totalCount ? "All Verified" : "Pending Verification"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{getDocumentTypeBadge(doc.documentType)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFileIcon(doc.mimeType)}
                      <span className="text-sm">{doc.fileName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}
                    </span>
                  </TableCell>
                  <TableCell>
                    {doc.expirationDate ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        {new Date(doc.expirationDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No expiration</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {doc.verified ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Pending</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.id, doc.fileName)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={doc.verified ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleVerify(doc)}
                      >
                        {doc.verified ? (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Unverify
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Verify
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDocument?.verified ? "Remove Verification" : "Verify Document"}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument?.verified
                ? "Remove verification status from this document?"
                : "Mark this document as verified and add verification notes."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedDocument && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Document:</p>
                  <p className="text-sm text-muted-foreground">{selectedDocument.fileName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Type:</p>
                  {getDocumentTypeBadge(selectedDocument.documentType)}
                </div>
                <div>
                  <label className="text-sm font-medium">Verification Notes</label>
                  <Textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add notes about this verification..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleConfirmVerify(!selectedDocument?.verified)}
              disabled={verifyMutation.isPending}
            >
              {selectedDocument?.verified ? "Remove Verification" : "Verify Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
