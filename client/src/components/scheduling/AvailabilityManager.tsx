import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TherapistAvailability } from "@shared/schema";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const SLOT_DURATIONS = [
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "60 minutes" },
  { value: 90, label: "90 minutes" },
];

export function AvailabilityManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 60,
  });

  // Fetch availability
  const { data: availability = [], isLoading } = useQuery<TherapistAvailability[]>({
    queryKey: ["/api/therapist/availability"],
  });

  // Create availability mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof newSlot) => {
      const res = await fetch("/api/therapist/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create availability");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/therapist/availability"] });
      toast({ title: "Success", description: "Availability added successfully" });
      setIsAdding(false);
      setNewSlot({ dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotDuration: 60 });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add availability", variant: "destructive" });
    },
  });

  // Delete availability mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/therapist/availability/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete availability");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/therapist/availability"] });
      toast({ title: "Success", description: "Availability deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete availability", variant: "destructive" });
    },
  });

  const handleAddSlot = () => {
    createMutation.mutate(newSlot);
  };

  const handleDeleteSlot = (id: string) => {
    if (confirm("Are you sure you want to delete this availability slot?")) {
      deleteMutation.mutate(id);
    }
  };

  // Group availability by day
  const availabilityByDay = availability.reduce((acc, slot) => {
    if (!acc[slot.dayOfWeek]) {
      acc[slot.dayOfWeek] = [];
    }
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {} as Record<number, TherapistAvailability[]>);

  if (isLoading) {
    return <div className="p-4">Loading availability...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Availability Schedule
        </CardTitle>
        <CardDescription>
          Set your weekly availability for appointments. Patients will only be able to book during these times.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display existing availability */}
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const slots = availabilityByDay[day.value] || [];

            return (
              <div key={day.value} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{day.label}</h3>
                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No availability set</p>
                ) : (
                  <div className="space-y-2">
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between bg-muted p-2 rounded"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({slot.slotDuration} min sessions)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSlot(slot.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add new availability form */}
        {!isAdding ? (
          <Button onClick={() => setIsAdding(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Availability Slot
          </Button>
        ) : (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
            <h3 className="font-semibold">Add New Availability</h3>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={newSlot.dayOfWeek.toString()}
                  onValueChange={(value) =>
                    setNewSlot({ ...newSlot, dayOfWeek: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Session Duration</Label>
                <Select
                  value={newSlot.slotDuration.toString()}
                  onValueChange={(value) =>
                    setNewSlot({ ...newSlot, slotDuration: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SLOT_DURATIONS.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value.toString()}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddSlot} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Slot"}
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
