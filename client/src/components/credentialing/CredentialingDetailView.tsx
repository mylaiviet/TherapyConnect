import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Shield,
  User,
  PlayCircle,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Sub-components
import DocumentViewer from "./DocumentViewer";
import VerificationChecklist from "./VerificationChecklist";
import CredentialingNotes from "./CredentialingNotes";

interface CredentialingDetailViewProps {
  therapistId: string;
  onBack: () => void;
}

export default function CredentialingDetailView({
  therapistId,
  onBack,
}: CredentialingDetailViewProps) {
  const { toast } = useToast();

  // Fetch credentialing details
  const { data: details, isLoading } = useQuery<any>({
    queryKey: [`/api/admin/credentialing/${therapistId}`],
  });

  // Run automated verifications
  const runAutomatedMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/admin/credentialing/${therapistId}/verify-automated`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/credentialing/${therapistId}`] });
      toast({
        title: "Automated verifications complete",
        description: "NPI, DEA, and OIG/SAM checks have been run",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to run automated verifications",
        variant: "destructive",
      });
    },
  });

  // Complete phase
  const completePhaseMutation = useMutation({
    mutationFn: (data: { phase: string; notes?: string }) =>
      apiRequest("POST", `/api/admin/credentialing/${therapistId}/complete-phase`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/credentialing/${therapistId}`] });
      toast({
        title: "Phase completed",
        description: "Credentialing phase marked as complete",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete phase",
        variant: "destructive",
      });
    },
  });

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

  if (!details) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>Provider not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { therapist, progress, verifications, notes, alerts } = details;
  const completedPhases = progress?.completedPhases || 0;
  const totalPhases = progress?.totalPhases || 8;
  const progressPercentage = (completedPhases / totalPhases) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => runAutomatedMutation.mutate()}
            disabled={runAutomatedMutation.isPending}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Run Automated Checks
          </Button>
        </div>
      </div>

      {/* Provider Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={therapist.photoUrl} />
                <AvatarFallback>
                  {therapist.firstName.charAt(0)}{therapist.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {therapist.firstName} {therapist.lastName}
                  {therapist.credentials && (
                    <span className="text-muted-foreground font-normal text-lg">
                      , {therapist.credentials}
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{therapist.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{therapist.licenseType}</Badge>
                  <Badge variant="outline">{therapist.licenseState}</Badge>
                  {therapist.npiNumber && (
                    <Badge variant="outline">NPI: {therapist.npiNumber}</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">
                Credentialing Progress
              </div>
              <div className="text-3xl font-bold">
                {completedPhases}/{totalPhases}
              </div>
              <Progress value={progressPercentage} className="mt-2 w-32" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Active Alerts */}
      {alerts && alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert: any) => (
                <div key={alert.id} className="flex items-start gap-2 text-sm">
                  <Badge
                    variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                    className="mt-0.5"
                  >
                    {alert.severity}
                  </Badge>
                  <span className="flex-1">{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="checklist" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checklist">
            <CheckCircle className="h-4 w-4 mr-2" />
            Verification Checklist
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 mr-2" />
            Notes ({notes?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checklist">
          <VerificationChecklist
            therapistId={therapistId}
            progress={progress}
            verifications={verifications}
          />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentViewer therapistId={therapistId} />
        </TabsContent>

        <TabsContent value="notes">
          <CredentialingNotes therapistId={therapistId} notes={notes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
