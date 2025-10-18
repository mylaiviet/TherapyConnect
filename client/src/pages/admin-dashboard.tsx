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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { CheckCircle, XCircle, Eye, Clock, Users } from "lucide-react";
import { type Therapist } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminDashboard() {
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: pendingTherapists, isLoading: loadingPending } = useQuery<Therapist[]>({
    queryKey: ["/api/admin/therapists/pending"],
  });

  const { data: allTherapists, isLoading: loadingAll } = useQuery<Therapist[]>({
    queryKey: ["/api/admin/therapists"],
  });

  const approveMutation = useMutation({
    mutationFn: (therapistId: string) =>
      apiRequest("POST", `/api/admin/therapists/${therapistId}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/therapists/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/therapists"] });
      toast({
        title: "Profile approved",
        description: "The therapist profile has been approved",
      });
      setViewDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve profile",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (therapistId: string) =>
      apiRequest("POST", `/api/admin/therapists/${therapistId}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/therapists/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/therapists"] });
      toast({
        title: "Profile rejected",
        description: "The therapist profile has been rejected",
      });
      setViewDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject profile",
        variant: "destructive",
      });
    },
  });

  const handleView = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setViewDialogOpen(true);
  };

  const handleApprove = (therapistId: string) => {
    approveMutation.mutate(therapistId);
  };

  const handleReject = (therapistId: string) => {
    rejectMutation.mutate(therapistId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-chart-3">Approved</Badge>;
      case "pending":
        return <Badge className="bg-chart-4">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return null;
    }
  };

  const stats = {
    total: allTherapists?.length || 0,
    approved: allTherapists?.filter((t) => t.profileStatus === "approved").length || 0,
    pending: pendingTherapists?.length || 0,
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Therapists</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending Approval ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">
              All Therapists
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPending ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : pendingTherapists && pendingTherapists.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Therapist</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>License</TableHead>
                        <TableHead>Specialties</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingTherapists.map((therapist) => (
                        <TableRow key={therapist.id} data-testid={`row-pending-${therapist.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={therapist.photoUrl || undefined} />
                                <AvatarFallback>
                                  {therapist.firstName[0]}{therapist.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {therapist.firstName} {therapist.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {therapist.credentials}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {therapist.city}, {therapist.state}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{therapist.licenseType}</p>
                              <p className="text-muted-foreground">{therapist.licenseNumber}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {therapist.topSpecialties?.slice(0, 2).map((s) => (
                                <Badge key={s} variant="secondary" className="text-xs">
                                  {s}
                                </Badge>
                              ))}
                              {therapist.topSpecialties && therapist.topSpecialties.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{therapist.topSpecialties.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleView(therapist)}
                                data-testid={`button-view-${therapist.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-chart-3 hover:bg-chart-3/90"
                                onClick={() => handleApprove(therapist.id)}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${therapist.id}`}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(therapist.id)}
                                disabled={rejectMutation.isPending}
                                data-testid={`button-reject-${therapist.id}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    No pending approvals
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Therapists</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAll ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : allTherapists && allTherapists.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Therapist</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allTherapists.map((therapist) => (
                        <TableRow key={therapist.id} data-testid={`row-all-${therapist.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={therapist.photoUrl || undefined} />
                                <AvatarFallback>
                                  {therapist.firstName[0]}{therapist.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {therapist.firstName} {therapist.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {therapist.credentials}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {therapist.city}, {therapist.state}
                          </TableCell>
                          <TableCell>{getStatusBadge(therapist.profileStatus)}</TableCell>
                          <TableCell>{therapist.profileViews || 0}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleView(therapist)}
                              data-testid={`button-view-all-${therapist.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    No therapists found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Dialog */}
        {selectedTherapist && (
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedTherapist.firstName} {selectedTherapist.lastName}
                </DialogTitle>
                <DialogDescription>
                  Review therapist profile details
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedTherapist.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedTherapist.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">
                      {selectedTherapist.city}, {selectedTherapist.state} {selectedTherapist.zipCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">License</p>
                    <p className="font-medium">
                      {selectedTherapist.licenseType} - {selectedTherapist.licenseNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">License State</p>
                    <p className="font-medium">{selectedTherapist.licenseState}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Years in Practice</p>
                    <p className="font-medium">{selectedTherapist.yearsInPractice || "N/A"}</p>
                  </div>
                </div>

                {selectedTherapist.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Biography</p>
                    <p className="text-sm leading-relaxed">{selectedTherapist.bio}</p>
                  </div>
                )}

                {selectedTherapist.topSpecialties && selectedTherapist.topSpecialties.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Specialties</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTherapist.topSpecialties.map((s) => (
                        <Badge key={s}>{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedTherapist.profileStatus === "pending" && (
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setViewDialogOpen(false)}
                    data-testid="button-dialog-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedTherapist.id)}
                    disabled={rejectMutation.isPending}
                    data-testid="button-dialog-reject"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    className="bg-chart-3 hover:bg-chart-3/90"
                    onClick={() => handleApprove(selectedTherapist.id)}
                    disabled={approveMutation.isPending}
                    data-testid="button-dialog-approve"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </DialogFooter>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
