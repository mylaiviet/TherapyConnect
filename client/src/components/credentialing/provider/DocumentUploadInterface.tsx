import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Calendar,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadInterfaceProps {
  documents: any[];
  isLoading: boolean;
}

const DOCUMENT_TYPES = [
  { value: "license", label: "Professional License", hasExpiration: true },
  { value: "transcript", label: "Graduate Transcript", hasExpiration: false },
  { value: "diploma", label: "Diploma/Degree", hasExpiration: false },
  { value: "government_id", label: "Government ID", hasExpiration: true },
  {
    value: "liability_insurance",
    label: "Liability Insurance",
    hasExpiration: true,
  },
  { value: "dea_certificate", label: "DEA Certificate", hasExpiration: true },
  {
    value: "board_certification",
    label: "Board Certification",
    hasExpiration: true,
  },
];

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function DocumentUploadInterface({
  documents,
  isLoading,
}: DocumentUploadInterfaceProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const { toast } = useToast();

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/therapist/credentialing/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/therapist/credentialing/documents"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/therapist/credentialing/status"],
      });
      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully",
      });
      // Reset form
      setSelectedFile(null);
      setDocumentType("");
      setExpirationDate("");
      setUploadError("");
      // Reset file input
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setUploadError(
        "Invalid file type. Please upload PDF, JPG, PNG, GIF, DOC, or DOCX files."
      );
      setSelectedFile(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(
        "File size exceeds 10MB. Please upload a smaller file."
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    // Validation
    if (!selectedFile) {
      setUploadError("Please select a file to upload");
      return;
    }

    if (!documentType) {
      setUploadError("Please select a document type");
      return;
    }

    const selectedDocType = DOCUMENT_TYPES.find((dt) => dt.value === documentType);
    if (selectedDocType?.hasExpiration && !expirationDate) {
      setUploadError("Please enter an expiration date for this document type");
      return;
    }

    // Create form data
    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("documentType", documentType);
    if (expirationDate) {
      formData.append("expirationDate", expirationDate);
    }

    uploadMutation.mutate(formData);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadError("");
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const selectedDocType = DOCUMENT_TYPES.find((dt) => dt.value === documentType);
  const requiresExpiration = selectedDocType?.hasExpiration || false;

  // Check if document type already uploaded
  const existingDocument = documents?.find(
    (doc) => doc.documentType === documentType
  );

  return (
    <div className="space-y-6">
      {/* Upload Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Credentialing Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Please upload clear, legible copies of
              your credentialing documents. Accepted formats: PDF, JPG, PNG, GIF,
              DOC, DOCX. Maximum file size: 10MB.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {/* Document Type Selection */}
            <div>
              <Label htmlFor="document-type">Document Type *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="document-type" className="mt-1">
                  <SelectValue placeholder="Select document type..." />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                      {type.hasExpiration && " (requires expiration date)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {existingDocument && (
                <p className="text-xs text-orange-600 mt-1">
                  Note: A {selectedDocType?.label} document is already uploaded.
                  Uploading a new one will add it to your documents list.
                </p>
              )}
            </div>

            {/* Expiration Date (conditional) */}
            {requiresExpiration && (
              <div>
                <Label htmlFor="expiration-date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expiration Date *
                </Label>
                <Input
                  id="expiration-date"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the date when this document expires
                </p>
              </div>
            )}

            {/* File Upload */}
            <div>
              <Label htmlFor="file-upload">Select File *</Label>
              <div className="mt-1">
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG, PNG, GIF, DOC, or DOCX (max 10MB)
              </p>
            </div>

            {/* Selected File Display */}
            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFile}
                  disabled={uploadMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Error Display */}
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={
                !selectedFile ||
                !documentType ||
                uploadMutation.isPending ||
                (requiresExpiration && !expirationDate)
              }
              className="w-full"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Document Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Quality:</strong> Ensure documents are clear, legible, and
                all information is visible
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Current:</strong> Upload the most recent version of your
                documents
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Complete:</strong> Include all pages of multi-page
                documents
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Expiration:</strong> Documents should be valid for at least
                60 days
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Verification:</strong> Documents will be reviewed within
                3-5 business days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recently Uploaded */}
      {documents && documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recently Uploaded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {DOCUMENT_TYPES.find(
                          (dt) => dt.value === doc.documentType
                        )?.label || doc.documentType}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {doc.verified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              ))}
              {documents.length > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  And {documents.length - 3} more document
                  {documents.length - 3 !== 1 ? "s" : ""}. View all in the "My
                  Documents" tab.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
