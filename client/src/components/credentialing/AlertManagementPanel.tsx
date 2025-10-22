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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface AlertManagementPanelProps {
  alerts: any[];
  isLoading: boolean;
}

export default function AlertManagementPanel({
  alerts,
  isLoading,
}: AlertManagementPanelProps) {
  const { toast } = useToast();

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: (alertId: string) =>
      apiRequest("POST", `/api/admin/credentialing/alerts/${alertId}/resolve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credentialing/alerts"] });
      toast({
        title: "Alert resolved",
        description: "Alert has been marked as resolved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve alert",
        variant: "destructive",
      });
    },
  });

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

  const handleResolve = (alertId: string) => {
    resolveAlertMutation.mutate(alertId);
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

  const criticalAlerts = alerts?.filter(a => a.severity === 'critical' && !a.resolved) || [];
  const warningAlerts = alerts?.filter(a => a.severity === 'warning' && !a.resolved) || [];
  const infoAlerts = alerts?.filter(a => a.severity === 'info' && !a.resolved) || [];
  const resolvedAlerts = alerts?.filter(a => a.resolved) || [];

  const AlertTable = ({ alerts }: { alerts: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Alert</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500/50" />
              <p>No alerts in this category</p>
            </TableCell>
          </TableRow>
        ) : (
          alerts.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell>
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.severity)}
                  <div>
                    <div className="font-medium text-sm">{alert.alertType.replace(/_/g, " ")}</div>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">Provider ID: {alert.therapistId.slice(0, 8)}...</div>
              </TableCell>
              <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {!alert.resolved && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(alert.id)}
                    disabled={resolveAlertMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve
                  </Button>
                )}
                {alert.resolved && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Resolved
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="critical">
          <TabsList>
            <TabsTrigger value="critical">
              <XCircle className="h-4 w-4 mr-2" />
              Critical ({criticalAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="warning">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Warning ({warningAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="info">
              <Clock className="h-4 w-4 mr-2" />
              Info ({infoAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolved ({resolvedAlerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="critical">
            <AlertTable alerts={criticalAlerts} />
          </TabsContent>

          <TabsContent value="warning">
            <AlertTable alerts={warningAlerts} />
          </TabsContent>

          <TabsContent value="info">
            <AlertTable alerts={infoAlerts} />
          </TabsContent>

          <TabsContent value="resolved">
            <AlertTable alerts={resolvedAlerts.slice(0, 20)} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
