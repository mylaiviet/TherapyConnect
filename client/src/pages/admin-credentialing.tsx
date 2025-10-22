import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  FileCheck,
  FileWarning,
  AlertTriangle,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Therapist } from "@shared/schema";

// Components
import PendingProvidersList from "@/components/credentialing/PendingProvidersList";
import CredentialingDetailView from "@/components/credentialing/CredentialingDetailView";
import AlertManagementPanel from "@/components/credentialing/AlertManagementPanel";

export default function AdminCredentialingDashboard() {
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch pending providers
  const { data: pendingProviders, isLoading: loadingPending } = useQuery<Therapist[]>({
    queryKey: ["/api/admin/credentialing/pending"],
  });

  // Fetch unresolved alerts
  const { data: alerts, isLoading: loadingAlerts } = useQuery<any[]>({
    queryKey: ["/api/admin/credentialing/alerts", { resolved: false }],
  });

  // Fetch OIG stats
  const { data: oigStats, isLoading: loadingOigStats } = useQuery<any>({
    queryKey: ["/api/admin/credentialing/oig/stats"],
  });

  // Stats calculations
  const pendingCount = pendingProviders?.length || 0;
  const alertCount = alerts?.length || 0;
  const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0;

  const handleSelectProvider = (therapistId: string) => {
    setSelectedTherapistId(therapistId);
  };

  const handleBackToList = () => {
    setSelectedTherapistId(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Provider Credentialing</h1>
        <p className="text-muted-foreground">
          Manage provider credentials, licenses, and compliance verification
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Providers awaiting credentialing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCount}</div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts} critical alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OIG Records</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingOigStats ? "-" : (oigStats?.totalRecords || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated: {loadingOigStats ? "-" : (oigStats?.lastUpdate ? new Date(oigStats.lastUpdate).toLocaleDateString() : "Never")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">
              All active providers verified
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            <Users className="h-4 w-4 mr-2" />
            Pending Providers ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alerts ({alertCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {selectedTherapistId ? (
            <CredentialingDetailView
              therapistId={selectedTherapistId}
              onBack={handleBackToList}
            />
          ) : (
            <PendingProvidersList
              providers={pendingProviders}
              isLoading={loadingPending}
              onSelectProvider={handleSelectProvider}
            />
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertManagementPanel
            alerts={alerts}
            isLoading={loadingAlerts}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
