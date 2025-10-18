import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Clock, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { TimeSlot } from "@shared/schema";

interface BookingCalendarProps {
  therapistId: string;
  therapistName: string;
}

export function BookingCalendar({ therapistId, therapistName }: BookingCalendarProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    notes: "",
  });

  // Fetch available slots for selected date
  const { data: availableSlots = [], isLoading: slotsLoading } = useQuery<TimeSlot[]>({
    queryKey: [`/api/therapists/${therapistId}/available-slots`, selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const res = await fetch(`/api/therapists/${therapistId}/available-slots?date=${dateStr}`);
      if (!res.ok) throw new Error("Failed to fetch slots");
      return res.json();
    },
    enabled: !!selectedDate,
  });

  // Book appointment mutation
  const bookMutation = useMutation({
    mutationFn: async (data: typeof formData & { appointmentDate: string; startTime: string; endTime: string }) => {
      const res = await fetch(`/api/therapists/${therapistId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to book appointment");
      return res.json();
    },
    onSuccess: (data) => {
      setBookingConfirmed(true);
      toast({ title: "Success!", description: "Your appointment has been booked" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to book appointment. Please try again.", variant: "destructive" });
    },
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setShowBookingForm(false);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setShowBookingForm(true);
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) return;

    const endTime = calculateEndTime(selectedSlot.time, selectedSlot.duration);

    bookMutation.mutate({
      ...formData,
      appointmentDate: format(selectedDate, "yyyy-MM-dd"),
      startTime: selectedSlot.time,
      endTime,
    });
  };

  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
  };

  // Show confirmation screen
  if (bookingConfirmed) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
            <p className="text-muted-foreground mt-2">
              Your appointment with {therapistName} has been scheduled.
            </p>
          </div>
          <div className="bg-muted p-4 rounded-lg text-left">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="font-medium">
                {selectedDate && format(selectedDate, "MMMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">
                {selectedSlot?.time} ({selectedSlot?.duration} minutes)
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to {formData.patientEmail}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Book Another Appointment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Book an Appointment
        </CardTitle>
        <CardDescription>
          Select a date and time to schedule your appointment with {therapistName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calendar */}
        <div className="flex justify-center">
          <Calendar
            onChange={handleDateSelect}
            value={selectedDate}
            minDate={new Date()}
            className="rounded-lg border"
          />
        </div>

        {/* Available time slots */}
        {selectedDate && (
          <div className="space-y-3">
            <h3 className="font-semibold">
              Available Times - {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            {slotsLoading ? (
              <p className="text-sm text-muted-foreground">Loading available times...</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No available appointments on this date. Please select another date.
              </p>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {availableSlots
                  .filter((slot) => slot.available)
                  .map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedSlot?.time === slot.time ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSlotSelect(slot)}
                    >
                      {slot.time}
                    </Button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Booking form */}
        {showBookingForm && selectedSlot && (
          <form onSubmit={handleSubmitBooking} className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Your Information</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                required
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.patientEmail}
                onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.patientPhone}
                onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes or Reason for Appointment (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Brief description of what you'd like to discuss..."
                rows={3}
              />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium mb-2">Appointment Summary</p>
              <p className="text-sm">
                <strong>Date:</strong> {selectedDate && format(selectedDate, "MMMM d, yyyy")}
              </p>
              <p className="text-sm">
                <strong>Time:</strong> {selectedSlot.time} ({selectedSlot.duration} minutes)
              </p>
              <p className="text-sm">
                <strong>Therapist:</strong> {therapistName}
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={bookMutation.isPending}>
              {bookMutation.isPending ? "Booking..." : "Confirm Booking"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
