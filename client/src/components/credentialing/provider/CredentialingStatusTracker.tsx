import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  FileText,
  GraduationCap,
  Building,
  XCircle,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CredentialingStatusTrackerProps {
  status: any;
  isLoading: boolean;
}

export default function CredentialingStatusTracker({
  status,
  isLoading,
}: CredentialingStatusTrackerProps) {
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

  const phases = [
    {
      id: "document_review",
      title: "Document Review",
      description: "Initial review of all submitted documents",
      icon: FileText,
    },
    {
      id: "npi_verification",
      title: "NPI Verification",
      description: "Verification of National Provider Identifier",
      icon: Shield,
    },
    {
      id: "license_verification",
      title: "License Verification",
      description: "State board license verification",
      icon: Shield,
    },
    {
      id: "education_verification",
      title: "Education Verification",
      description: "Graduate school and degree verification",
      icon: GraduationCap,
    },
    {
      id: "background_check",
      title: "Background Check",
      description: "Professional background screening",
      icon: Shield,
    },
    {
      id: "insurance_verification",
      title: "Insurance Verification",
      description: "Liability insurance coverage verification",
      icon: Building,
    },
    {
      id: "oig_sam_check",
      title: "OIG/SAM Exclusion",
      description: "Federal exclusion database check",
      icon: Shield,
    },
    {
      id: "final_review",
      title: "Final Review",
      description: "Final approval and credentialing decision",
      icon: CheckCircle,
    },
  ];

  const getPhaseStatus = (phaseId: string) => {
    const timeline = status?.timeline?.find((t: any) => t.phase === phaseId);
    return timeline?.status || "pending";
  };

  const getPhaseDate = (phaseId: string) => {
    const timeline = status?.timeline?.find((t: any) => t.phase === phaseId);
    return timeline?.completedAt;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "in_progress":
        return <Clock className="h-6 w-6 text-blue-500 animate-pulse" />;
      case "failed":
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "failed":
        return <Badge variant="destructive">Needs Attention</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const completedCount = status?.completedPhasesCount || status?.completedPhases?.length || 0;
  const totalCount = status?.totalPhases || 8;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const overallStatus = status?.credentialingStatus || "not_started";
  const daysInProcess = status?.daysInProcess || 0;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Credentialing Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {completedCount} of {totalCount} phases completed
              </span>
              <span className="text-sm font-medium">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <div className="text-sm font-medium">
                  {overallStatus === "approved" && (
                    <span className="text-green-600 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Approved
                    </span>
                  )}
                  {overallStatus === "in_progress" && (
                    <span className="text-blue-600 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      In Progress
                    </span>
                  )}
                  {overallStatus === "pending" && (
                    <span className="text-yellow-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Pending Review
                    </span>
                  )}
                  {overallStatus === "not_started" && (
                    <span className="text-gray-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Not Started
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Time in Process
                </p>
                <p className="text-sm font-medium">
                  {daysInProcess > 0 ? `${daysInProcess} days` : "Not started"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Credentialing Phases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {phases.map((phase, index) => {
              const phaseStatus = getPhaseStatus(phase.id);
              const completedDate = getPhaseDate(phase.id);
              const Icon = phase.icon;
              const isCompleted = phaseStatus === "completed";
              const isInProgress = phaseStatus === "in_progress";
              const isFailed = phaseStatus === "failed";

              return (
                <div key={phase.id} className="relative">
                  {/* Connecting Line */}
                  {index < phases.length - 1 && (
                    <div
                      className={`absolute left-[23px] top-[48px] w-0.5 h-8 ${
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}

                  {/* Phase Card */}
                  <div
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      isInProgress
                        ? "border-blue-500 bg-blue-50"
                        : isFailed
                        ? "border-red-500 bg-red-50"
                        : isCompleted
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0 ${
                        isCompleted
                          ? "bg-green-100"
                          : isInProgress
                          ? "bg-blue-100"
                          : isFailed
                          ? "bg-red-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          isCompleted
                            ? "text-green-600"
                            : isInProgress
                            ? "text-blue-600"
                            : isFailed
                            ? "text-red-600"
                            : "text-gray-400"
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h4 className="text-sm font-medium">{phase.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {phase.description}
                          </p>
                        </div>
                        {getStatusBadge(phaseStatus)}
                      </div>
                      {completedDate && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Completed{" "}
                          {formatDistanceToNow(new Date(completedDate), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </div>

                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {getStatusIcon(phaseStatus)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* NPI Status Card */}
      {status?.therapistInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              National Provider Identifier (NPI)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status.therapistInfo.npiNumber ? (
                <>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          NPI: {status.therapistInfo.npiNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {status.therapistInfo.firstName} {status.therapistInfo.lastName}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-500">Verified</Badge>
                  </div>

                  {/* NPI Verification Details */}
                  {status.verifications?.find((v: any) => v.verificationType === 'npi') && (
                    <div className="pl-4 space-y-2">
                      {(() => {
                        const npiVerification = status.verifications.find((v: any) => v.verificationType === 'npi');
                        return (
                          <>
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-muted-foreground">
                                Last verified:{" "}
                                <span className="font-medium text-foreground">
                                  {npiVerification.verificationDate
                                    ? formatDistanceToNow(new Date(npiVerification.verificationDate), { addSuffix: true })
                                    : 'N/A'
                                  }
                                </span>
                              </span>
                            </div>
                            {npiVerification.verificationDate && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(npiVerification.verificationDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            )}
                            {npiVerification.verificationSource && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Shield className="h-3 w-3" />
                                Source: {npiVerification.verificationSource}
                              </div>
                            )}
                            {npiVerification.notes && (
                              <div className="text-xs text-muted-foreground italic">
                                {npiVerification.notes}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">NPI Not Verified</div>
                      <div className="text-xs text-muted-foreground">
                        Please verify your NPI in the NPI Verification tab
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-amber-500 text-amber-700">
                    Pending
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Automated Verifications */}
      {status?.verifications && status.verifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Automated Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status.verifications.map((verification: any) => (
                <div
                  key={verification.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(verification.status)}
                    <div>
                      <div className="font-medium text-sm">
                        {verification.verificationType.toUpperCase()} Verification
                      </div>
                      {verification.verificationDate && (
                        <div className="text-xs text-muted-foreground">
                          Verified:{" "}
                          {new Date(
                            verification.verificationDate
                          ).toLocaleDateString()}
                        </div>
                      )}
                      {verification.notes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {verification.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(verification.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* What's Next */}
      <Card className="border-blue-500 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-900">
            {overallStatus === "not_started" && (
              <p>
                Upload all required credentialing documents to begin the
                verification process.
              </p>
            )}
            {overallStatus === "pending" && (
              <p>
                Your documents are under review. We'll notify you of any updates or
                if additional information is needed.
              </p>
            )}
            {overallStatus === "in_progress" && (
              <>
                <p>
                  Your credentialing is currently in progress. The current phase is
                  being reviewed by our team.
                </p>
                <p className="mt-2">
                  Estimated completion time: 2-4 weeks from submission date
                </p>
              </>
            )}
            {overallStatus === "approved" && (
              <>
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Congratulations! Your credentialing has been approved.
                </p>
                <p className="mt-2">
                  You can now accept client appointments through our platform.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
