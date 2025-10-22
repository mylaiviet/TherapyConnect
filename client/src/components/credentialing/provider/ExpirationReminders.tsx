import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Calendar,
  FileText,
  XCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface ExpirationRemindersProps {
  alerts: any[];
  expiringDocuments: any[];
  isLoading: boolean;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  license: "Professional License",
  transcript: "Graduate Transcript",
  diploma: "Diploma/Degree",
  government_id: "Government ID",
  liability_insurance: "Liability Insurance",
  dea_certificate: "DEA Certificate",
  board_certification: "Board Certification",
};

export default function ExpirationReminders({
  alerts,
  expiringDocuments,
  isLoading,
}: ExpirationRemindersProps) {
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

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "warning":
        return <Badge className="bg-orange-500">Warning</Badge>;
      case "info":
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getExpirationUrgency = (expirationDate: string) => {
    const daysUntilExpiration = Math.ceil(
      (new Date(expirationDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiration < 0) {
      return { urgency: "expired", badge: "Expired", color: "destructive" };
    }
    if (daysUntilExpiration <= 7) {
      return {
        urgency: "critical",
        badge: `${daysUntilExpiration} days`,
        color: "destructive",
      };
    }
    if (daysUntilExpiration <= 30) {
      return {
        urgency: "warning",
        badge: `${daysUntilExpiration} days`,
        color: "orange",
      };
    }
    return {
      urgency: "notice",
      badge: `${daysUntilExpiration} days`,
      color: "secondary",
    };
  };

  const activeAlerts = alerts?.filter((a) => !a.resolved) || [];
  const criticalAlerts = activeAlerts.filter((a) => a.severity === "critical");
  const warningAlerts = activeAlerts.filter((a) => a.severity === "warning");
  const infoAlerts = activeAlerts.filter((a) => a.severity === "info");

  // Sort expiring documents by expiration date (soonest first)
  const sortedExpiringDocs = [...expiringDocuments].sort((a, b) => {
    return (
      new Date(a.expirationDate).getTime() -
      new Date(b.expirationDate).getTime()
    );
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {criticalAlerts.length > 0 ? (
                <>
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold text-red-500">
                      {criticalAlerts.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Immediate action needed
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
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {warningAlerts.length > 0 ? (
                <>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold text-orange-500">
                      {warningAlerts.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Attention required
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-500">0</div>
                    <p className="text-xs text-muted-foreground">None</p>
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

      {/* Main Content */}
      <Tabs defaultValue="alerts">
        <TabsList>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Active Alerts
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expiring">
            <Calendar className="h-4 w-4 mr-2" />
            Expiring Documents
            {expiringDocuments.length > 0 && (
              <Badge className="bg-orange-500 ml-2">
                {expiringDocuments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {activeAlerts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500/50" />
                  <p className="text-lg font-medium">No active alerts</p>
                  <p className="text-sm mt-2">
                    You're all caught up! We'll notify you of any issues.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Critical Alerts */}
                  {criticalAlerts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Critical ({criticalAlerts.length})
                      </h3>
                      <div className="space-y-2">
                        {criticalAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-3">
                                {getAlertIcon(alert.severity)}
                                <div>
                                  <div className="font-medium text-sm">
                                    {alert.alertType.replace(/_/g, " ")}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {alert.message}
                                  </p>
                                </div>
                              </div>
                              {getSeverityBadge(alert.severity)}
                            </div>
                            <p className="text-xs text-muted-foreground pl-8">
                              {formatDistanceToNow(new Date(alert.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warning Alerts */}
                  {warningAlerts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-orange-600 mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Warnings ({warningAlerts.length})
                      </h3>
                      <div className="space-y-2">
                        {warningAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-3">
                                {getAlertIcon(alert.severity)}
                                <div>
                                  <div className="font-medium text-sm">
                                    {alert.alertType.replace(/_/g, " ")}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {alert.message}
                                  </p>
                                </div>
                              </div>
                              {getSeverityBadge(alert.severity)}
                            </div>
                            <p className="text-xs text-muted-foreground pl-8">
                              {formatDistanceToNow(new Date(alert.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Info Alerts */}
                  {infoAlerts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Information ({infoAlerts.length})
                      </h3>
                      <div className="space-y-2">
                        {infoAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-3">
                                {getAlertIcon(alert.severity)}
                                <div>
                                  <div className="font-medium text-sm">
                                    {alert.alertType.replace(/_/g, " ")}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {alert.message}
                                  </p>
                                </div>
                              </div>
                              {getSeverityBadge(alert.severity)}
                            </div>
                            <p className="text-xs text-muted-foreground pl-8">
                              {formatDistanceToNow(new Date(alert.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring">
          <Card>
            <CardHeader>
              <CardTitle>Expiring Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {expiringDocuments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500/50" />
                  <p className="text-lg font-medium">No expiring documents</p>
                  <p className="text-sm mt-2">
                    All your documents are valid for more than 60 days.
                  </p>
                </div>
              ) : (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Type</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Time Remaining</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedExpiringDocs.map((doc) => {
                        const expiration = getExpirationUrgency(
                          doc.expirationDate
                        );
                        return (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium">
                                  {DOCUMENT_TYPE_LABELS[doc.documentType] ||
                                    doc.documentType}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {doc.fileName}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {new Date(
                                  doc.expirationDate
                                ).toLocaleDateString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  expiration.color as
                                    | "default"
                                    | "destructive"
                                    | "secondary"
                                }
                                className={
                                  expiration.color === "orange"
                                    ? "bg-orange-500"
                                    : ""
                                }
                              >
                                {expiration.badge}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Link href="/provider-credentialing?tab=upload">
                                <Button size="sm" variant="outline">
                                  Upload New
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-orange-900">
                        <p className="font-medium mb-1">
                          Action Required: Update Expiring Documents
                        </p>
                        <p>
                          Please upload updated versions of these documents to
                          maintain your credentialing status. Documents must be
                          valid for at least 60 days.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
