import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
  Calendar,
  Eye,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface RequiredDocumentsChecklistProps {
  documents: any[];
  isLoading: boolean;
}

const REQUIRED_DOCUMENTS = [
  { type: "license", label: "Professional License", required: true },
  { type: "transcript", label: "Graduate Transcript", required: true },
  { type: "diploma", label: "Diploma/Degree", required: true },
  { type: "government_id", label: "Government ID", required: true },
  { type: "liability_insurance", label: "Liability Insurance", required: true },
  { type: "dea_certificate", label: "DEA Certificate", required: false },
  { type: "board_certification", label: "Board Certification", required: false },
];

export default function RequiredDocumentsChecklist({
  documents,
  isLoading,
}: RequiredDocumentsChecklistProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const { toast } = useToast();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (documentId: string) =>
      apiRequest("DELETE", `/api/therapist/credentialing/documents/${documentId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/therapist/credentialing/documents"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/therapist/credentialing/status"],
      });
      toast({
        title: "Document deleted",
        description: "Document has been removed successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (document: any) => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedDocument) {
      deleteMutation.mutate(selectedDocument.id);
    }
  };

  const handleDownload = (documentId: string, fileName: string) => {
    window.open(`/api/credentialing/documents/${documentId}/download`, "_blank");
  };

  const getDocumentsByType = (type: string) => {
    return documents?.filter((doc) => doc.documentType === type) || [];
  };

  const getDocumentStatusBadge = (docs: any[], required: boolean) => {
    if (docs.length === 0) {
      return required ? (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Required
        </Badge>
      ) : (
        <Badge variant="outline">Optional</Badge>
      );
    }

    const verifiedDocs = docs.filter((d) => d.verified);
    if (verifiedDocs.length > 0) {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    }

    return (
      <Badge className="bg-yellow-500">
        <AlertCircle className="h-3 w-3 mr-1" />
        Pending Verification
      </Badge>
    );
  };

  const getExpirationStatus = (expirationDate: string | null) => {
    if (!expirationDate) return null;

    const daysUntilExpiration = Math.ceil(
      (new Date(expirationDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiration < 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          Expired
        </Badge>
      );
    }

    if (daysUntilExpiration <= 30) {
      return (
        <Badge className="bg-red-500 text-xs">
          Expires in {daysUntilExpiration} days
        </Badge>
      );
    }

    if (daysUntilExpiration <= 60) {
      return (
        <Badge className="bg-orange-500 text-xs">
          Expires in {daysUntilExpiration} days
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="text-xs">
        Expires {new Date(expirationDate).toLocaleDateString()}
      </Badge>
    );
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

  const requiredUploaded = REQUIRED_DOCUMENTS.filter(
    (req) => req.required && getDocumentsByType(req.type).length > 0
  ).length;
  const totalRequired = REQUIRED_DOCUMENTS.filter((req) => req.required).length;

  const allDocumentsVerified = documents?.every((doc) => doc.verified) || false;
  const allRequiredUploaded = requiredUploaded === totalRequired;

  return (
    <>
      <div className="space-y-6">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Document Requirements</CardTitle>
              <Badge
                variant={allRequiredUploaded ? "default" : "secondary"}
                className={allRequiredUploaded ? "bg-green-500" : ""}
              >
                {requiredUploaded} / {totalRequired} Required Documents
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {allRequiredUploaded ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">
                      All required documents uploaded
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-600 font-medium">
                      {totalRequired - requiredUploaded} required document
                      {totalRequired - requiredUploaded !== 1 ? "s" : ""} missing
                    </span>
                  </>
                )}
              </div>
              {allRequiredUploaded && !allDocumentsVerified && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-blue-600 font-medium">
                    Documents pending verification
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Credentialing Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {REQUIRED_DOCUMENTS.map((reqDoc) => {
                const docs = getDocumentsByType(reqDoc.type);
                const hasDocuments = docs.length > 0;

                return (
                  <div
                    key={reqDoc.type}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <h4 className="font-medium">{reqDoc.label}</h4>
                          {reqDoc.required && (
                            <p className="text-xs text-muted-foreground">
                              Required for credentialing
                            </p>
                          )}
                        </div>
                      </div>
                      {getDocumentStatusBadge(docs, reqDoc.required)}
                    </div>

                    {hasDocuments && (
                      <div className="space-y-2 mt-3">
                        {docs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium truncate">
                                  {doc.fileName}
                                </p>
                                {doc.verified && (
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>
                                  Uploaded{" "}
                                  {formatDistanceToNow(new Date(doc.uploadedAt), {
                                    addSuffix: true,
                                  })}
                                </span>
                                <span>
                                  {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                                </span>
                                {doc.expirationDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {getExpirationStatus(doc.expirationDate)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDownload(doc.id, doc.fileName)
                                }
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {!doc.verified && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(doc)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!hasDocuments && (
                      <p className="text-sm text-muted-foreground pl-8">
                        No documents uploaded yet. Upload via the "Upload Documents"
                        tab.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Important Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Verification Process:</strong> Documents are typically
                  reviewed within 3-5 business days of submission.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Expiration Tracking:</strong> We'll send you reminders
                  when documents are expiring soon.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Document Updates:</strong> You can upload new versions
                  of documents at any time. Verified documents cannot be deleted.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Questions?:</strong> Contact our credentialing team at{" "}
                  <a
                    href="mailto:credentialing@therapyconnect.com"
                    className="text-blue-600 underline"
                  >
                    credentialing@therapyconnect.com
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="py-4">
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium mb-1">File Name:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDocument.fileName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Document Type:</p>
                  <p className="text-sm text-muted-foreground">
                    {REQUIRED_DOCUMENTS.find(
                      (rd) => rd.type === selectedDocument.documentType
                    )?.label || selectedDocument.documentType}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
