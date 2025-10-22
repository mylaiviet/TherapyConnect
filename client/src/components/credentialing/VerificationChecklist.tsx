import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Shield,
  FileText,
  GraduationCap,
  Building,
  CreditCard,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface VerificationChecklistProps {
  therapistId: string;
  progress: any;
  verifications: any[];
}

export default function VerificationChecklist({
  therapistId,
  progress,
  verifications,
}: VerificationChecklistProps) {
  const { toast } = useToast();

  // Complete phase mutation
  const completePhaseMutation = useMutation({
    mutationFn: (phase: string) =>
      apiRequest("POST", `/api/admin/credentialing/${therapistId}/complete-phase`, { phase }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/credentialing/${therapistId}`] });
      toast({
        title: "Phase completed",
        description: "Credentialing phase has been marked as complete",
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

  const phases = [
    {
      id: "document_review",
      title: "Document Review",
      description: "Review all uploaded documents for completeness",
      icon: FileText,
    },
    {
      id: "npi_verification",
      title: "NPI Verification",
      description: "Verify NPI number via CMS Registry",
      icon: Shield,
    },
    {
      id: "license_verification",
      title: "License Verification",
      description: "Verify professional license with state board",
      icon: Shield,
    },
    {
      id: "education_verification",
      title: "Education Verification",
      description: "Verify graduate school and degree",
      icon: GraduationCap,
    },
    {
      id: "background_check",
      title: "Background Check",
      description: "Run background check and OIG/SAM exclusion",
      icon: Shield,
    },
    {
      id: "insurance_verification",
      title: "Insurance Verification",
      description: "Verify liability insurance coverage",
      icon: Building,
    },
    {
      id: "oig_sam_check",
      title: "OIG/SAM Exclusion",
      description: "Check federal exclusion databases",
      icon: Shield,
    },
    {
      id: "final_review",
      title: "Final Review",
      description: "Final approval review and decision",
      icon: CheckCircle,
    },
  ];

  const getPhaseStatus = (phaseId: string) => {
    const timeline = progress?.timeline?.find((t: any) => t.phase === phaseId);
    return timeline?.status || "pending";
  };

  const getVerificationStatus = (type: string) => {
    const verification = verifications?.find((v: any) => v.verificationType === type);
    return verification?.status || "not_started";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "verified":
        return <Badge className="bg-green-500">Verified</Badge>;
      case "requires_review":
        return <Badge variant="secondary">Requires Review</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const handleCompletePhase = (phaseId: string) => {
    completePhaseMutation.mutate(phaseId);
  };

  const completedCount = progress?.completedPhases || 0;
  const totalCount = progress?.totalPhases || 8;
  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Credentialing Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {completedCount} of {totalCount} phases completed
              </span>
              <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} />
            <div className="flex gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {progress?.daysInProcess ? `${progress.daysInProcess} days in process` : "Not started"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automated Verifications */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["npi", "dea", "oig", "sam"].map((type) => {
              const verification = verifications?.find((v: any) => v.verificationType === type);
              const status = verification?.status || "not_started";
              return (
                <div key={type} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status)}
                    <div>
                      <div className="font-medium">{type.toUpperCase()} Verification</div>
                      {verification?.verificationDate && (
                        <div className="text-sm text-muted-foreground">
                          Verified: {new Date(verification.verificationDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(status)}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Phase Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Credentialing Phases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {phases.map((phase, index) => {
              const status = getPhaseStatus(phase.id);
              const isCompleted = status === "completed";
              const isInProgress = status === "in_progress";
              const Icon = phase.icon;

              return (
                <div key={phase.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{phase.title}</div>
                        {getStatusBadge(status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {phase.description}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">
                    {isCompleted ? (
                      getStatusIcon("completed")
                    ) : isInProgress ? (
                      <Button
                        size="sm"
                        onClick={() => handleCompletePhase(phase.id)}
                        disabled={completePhaseMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompletePhase(phase.id)}
                        disabled={completePhaseMutation.isPending}
                      >
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
