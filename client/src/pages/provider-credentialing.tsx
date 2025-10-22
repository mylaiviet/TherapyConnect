import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  Calendar,
} from "lucide-react";
import DocumentUploadInterface from "@/components/credentialing/provider/DocumentUploadInterface";
import CredentialingStatusTracker from "@/components/credentialing/provider/CredentialingStatusTracker";
import RequiredDocumentsChecklist from "@/components/credentialing/provider/RequiredDocumentsChecklist";
import ExpirationReminders from "@/components/credentialing/provider/ExpirationReminders";
import NPIVerificationForm from "@/components/credentialing/provider/NPIVerificationForm";

export default function ProviderCredentialingPortal() {
  // Fetch credentialing status
  const { data: credentialingData, isLoading } = useQuery<any>({
    queryKey: ["/api/therapist/credentialing/status"],
  });

  // Fetch uploaded documents
  const { data: documents, isLoading: documentsLoading } = useQuery<any[]>({
    queryKey: ["/api/therapist/credentialing/documents"],
  });

  // Fetch alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery<any[]>({
    queryKey: ["/api/therapist/credentialing/alerts"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approved
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-500 text-white">
            <Clock className="h-4 w-4 mr-2" />
            In Progress
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500 text-white">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Needs Attention
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Not Started
          </Badge>
        );
    }
  };

  const activeAlerts = alerts?.filter((a) => !a.resolved) || [];
  const criticalAlerts = activeAlerts.filter((a) => a.severity === "critical");
  const expiringDocuments =
    documents?.filter((d) => {
      if (!d.expirationDate) return false;
      const daysUntilExpiration = Math.ceil(
        (new Date(d.expirationDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiration <= 60 && daysUntilExpiration > 0;
    }) || [];

  const credentialingStatus = credentialingData?.credentialingStatus || "not_started";
  const daysInProcess = credentialingData?.daysInProcess || 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Credentialing Portal</h1>
        <p className="text-muted-foreground">
          Manage your professional credentials and verification documents
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Credentialing Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {getStatusBadge(credentialingStatus)}
              </div>
            </div>
            {daysInProcess > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {daysInProcess} days in process
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents Uploaded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {documents?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {documents?.filter((d) => d.verified).length || 0} verified
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {criticalAlerts.length > 0 ? (
                <>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold text-red-500">
                      {criticalAlerts.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Needs attention
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-500">0</div>
                    <p className="text-xs text-muted-foreground">All clear</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {expiringDocuments.length > 0 ? (
                <>
                  <Calendar className="h-8 w-8 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold text-orange-500">
                      {expiringDocuments.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Within 60 days
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-500">0</div>
                    <p className="text-xs text-muted-foreground">None expiring</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {criticalAlerts.length} critical alert
            {criticalAlerts.length !== 1 ? "s" : ""} that require immediate
            attention. Please review the alerts section below.
          </AlertDescription>
        </Alert>
      )}

      {/* Expiration Warning Banner */}
      {expiringDocuments.length > 0 && (
        <Alert className="mb-6 border-orange-500 bg-orange-50">
          <Calendar className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-900">
            You have {expiringDocuments.length} document
            {expiringDocuments.length !== 1 ? "s" : ""} expiring within 60 days.
            Please upload updated documents to maintain your credentialing status.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="status" className="space-y-6">
        <TabsList>
          <TabsTrigger value="status">
            <Shield className="h-4 w-4 mr-2" />
            Status & Progress
          </TabsTrigger>
          <TabsTrigger value="npi">
            <Shield className="h-4 w-4 mr-2" />
            NPI Verification
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            My Documents
          </TabsTrigger>
          {(activeAlerts.length > 0 || expiringDocuments.length > 0) && (
            <TabsTrigger value="alerts">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alerts & Reminders
              {activeAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {activeAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="status">
          <CredentialingStatusTracker
            status={credentialingData}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="npi">
          <NPIVerificationForm />
        </TabsContent>

        <TabsContent value="upload">
          <DocumentUploadInterface
            documents={documents}
            isLoading={documentsLoading}
          />
        </TabsContent>

        <TabsContent value="documents">
          <RequiredDocumentsChecklist
            documents={documents}
            isLoading={documentsLoading}
          />
        </TabsContent>

        {(activeAlerts.length > 0 || expiringDocuments.length > 0) && (
          <TabsContent value="alerts">
            <ExpirationReminders
              alerts={alerts}
              expiringDocuments={expiringDocuments}
              isLoading={alertsLoading || documentsLoading}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
