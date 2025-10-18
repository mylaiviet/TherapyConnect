import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Mail, Phone, Check, X, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@shared/schema";
import { format } from "date-fns";

export function AppointmentsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("upcoming");

  // Fetch appointments
  const { data: allAppointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/therapist/appointments"],
  });

  // Approve appointment mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/therapist/appointments/${id}/approve`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve appointment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/therapist/appointments"] });
      toast({ title: "Success", description: "Appointment approved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve appointment", variant: "destructive" });
    },
  });

  // Reject appointment mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/therapist/appointments/${id}/reject`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reject appointment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/therapist/appointments"] });
      toast({ title: "Success", description: "Appointment rejected" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject appointment", variant: "destructive" });
    },
  });

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/therapist/appointments/${id}/cancel`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to cancel appointment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/therapist/appointments"] });
      toast({ title: "Success", description: "Appointment cancelled" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to cancel appointment", variant: "destructive" });
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    if (confirm("Are you sure you want to reject this appointment request?")) {
      rejectMutation.mutate(id);
    }
  };

  const handleCancel = (id: string) => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      cancelMutation.mutate(id);
    }
  };

  // Filter appointments
  const pendingAppointments = allAppointments.filter((apt) => apt.status === "pending");
  const upcomingAppointments = allAppointments.filter(
    (apt) => apt.status === "confirmed" && new Date(apt.appointmentDate) >= new Date()
  );
  const pastAppointments = allAppointments.filter(
    (apt) => apt.status === "completed" || new Date(apt.appointmentDate) < new Date()
  );
  const cancelledAppointments = allAppointments.filter((apt) => apt.status === "cancelled");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{appointment.patientName}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(appointment.appointmentDate), "MMMM d, yyyy")}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {appointment.startTime} - {appointment.endTime}
                </div>
              </div>
            </div>
            {getStatusBadge(appointment.status)}
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {appointment.patientEmail}
            </div>
            {appointment.patientPhone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {appointment.patientPhone}
              </div>
            )}
          </div>

          {appointment.notes && (
            <div className="text-sm">
              <span className="font-medium">Notes: </span>
              <span className="text-muted-foreground">{appointment.notes}</span>
            </div>
          )}

          {appointment.status === "pending" && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => handleApprove(appointment.id)}
                disabled={approveMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(appointment.id)}
                disabled={rejectMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}

          {appointment.status === "confirmed" && (
            <div className="pt-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleCancel(appointment.id)}
                disabled={cancelMutation.isPending}
              >
                <Ban className="h-4 w-4 mr-1" />
                Cancel Appointment
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="p-4">Loading appointments...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments</CardTitle>
        <CardDescription>Manage your upcoming and past appointments</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Pending {pendingAppointments.length > 0 && `(${pendingAppointments.length})`}
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming {upcomingAppointments.length > 0 && `(${upcomingAppointments.length})`}
            </TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {pendingAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No pending appointment requests
              </p>
            ) : (
              pendingAppointments.map((apt) => <AppointmentCard key={apt.id} appointment={apt} />)
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4">
            {upcomingAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No upcoming appointments</p>
            ) : (
              upcomingAppointments.map((apt) => <AppointmentCard key={apt.id} appointment={apt} />)
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            {pastAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No past appointments</p>
            ) : (
              pastAppointments.map((apt) => <AppointmentCard key={apt.id} appointment={apt} />)
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="mt-4">
            {cancelledAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No cancelled appointments</p>
            ) : (
              cancelledAppointments.map((apt) => <AppointmentCard key={apt.id} appointment={apt} />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
