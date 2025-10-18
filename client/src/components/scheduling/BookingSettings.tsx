import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BookingSettings as BookingSettingsType } from "@shared/schema";

export function BookingSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch booking settings
  const { data: settings, isLoading } = useQuery<BookingSettingsType>({
    queryKey: ["/api/therapist/booking-settings"],
  });

  const [formData, setFormData] = useState({
    bookingMode: "instant" as "instant" | "request",
    bufferTime: 0,
    advanceBookingDays: 30,
    minNoticeHours: 24,
    allowCancellation: true,
    cancellationHours: 24,
    emailNotifications: true,
  });

  // Update form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        bookingMode: settings.bookingMode,
        bufferTime: settings.bufferTime || 0,
        advanceBookingDays: settings.advanceBookingDays || 30,
        minNoticeHours: settings.minNoticeHours || 24,
        allowCancellation: settings.allowCancellation ?? true,
        cancellationHours: settings.cancellationHours || 24,
        emailNotifications: settings.emailNotifications ?? true,
      });
    }
  }, [settings]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/therapist/booking-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/therapist/booking-settings"] });
      toast({ title: "Success", description: "Booking settings updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-4">Loading settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Booking Settings
        </CardTitle>
        <CardDescription>
          Configure how patients can book appointments with you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Booking Mode */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Booking Mode</Label>
          <RadioGroup
            value={formData.bookingMode}
            onValueChange={(value) =>
              setFormData({ ...formData, bookingMode: value as "instant" | "request" })
            }
          >
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="instant" id="instant" />
              <div className="space-y-1 leading-none">
                <Label htmlFor="instant" className="cursor-pointer">
                  Instant Confirmation
                </Label>
                <p className="text-sm text-muted-foreground">
                  Patients can book appointments immediately without your approval. Best for maximum
                  availability.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="request" id="request" />
              <div className="space-y-1 leading-none">
                <Label htmlFor="request" className="cursor-pointer">
                  Request & Approval
                </Label>
                <p className="text-sm text-muted-foreground">
                  Patients send booking requests that you must approve. Gives you more control over
                  your schedule.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Buffer Time */}
        <div className="space-y-2">
          <Label htmlFor="bufferTime">Buffer Time Between Appointments</Label>
          <div className="flex items-center gap-2">
            <Input
              id="bufferTime"
              type="number"
              min="0"
              max="60"
              step="5"
              value={formData.bufferTime}
              onChange={(e) =>
                setFormData({ ...formData, bufferTime: parseInt(e.target.value) || 0 })
              }
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">minutes</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Extra time between appointments for breaks, notes, etc.
          </p>
        </div>

        {/* Advance Booking */}
        <div className="space-y-2">
          <Label htmlFor="advanceBooking">How Far Ahead Can Patients Book?</Label>
          <div className="flex items-center gap-2">
            <Input
              id="advanceBooking"
              type="number"
              min="1"
              max="365"
              value={formData.advanceBookingDays}
              onChange={(e) =>
                setFormData({ ...formData, advanceBookingDays: parseInt(e.target.value) || 30 })
              }
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">days in advance</span>
          </div>
        </div>

        {/* Minimum Notice */}
        <div className="space-y-2">
          <Label htmlFor="minNotice">Minimum Notice for Booking</Label>
          <div className="flex items-center gap-2">
            <Input
              id="minNotice"
              type="number"
              min="0"
              max="168"
              value={formData.minNoticeHours}
              onChange={(e) =>
                setFormData({ ...formData, minNoticeHours: parseInt(e.target.value) || 24 })
              }
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">hours notice required</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Prevent last-minute bookings. Set to 0 for same-day appointments.
          </p>
        </div>

        {/* Cancellation Policy */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowCancel">Allow Patient Cancellations</Label>
              <p className="text-sm text-muted-foreground">
                Let patients cancel their own appointments
              </p>
            </div>
            <Switch
              id="allowCancel"
              checked={formData.allowCancellation}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, allowCancellation: checked })
              }
            />
          </div>

          {formData.allowCancellation && (
            <div className="space-y-2 pl-4 border-l-2">
              <Label htmlFor="cancellationHours">Cancellation Notice Required</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cancellationHours"
                  type="number"
                  min="0"
                  max="168"
                  value={formData.cancellationHours}
                  onChange={(e) =>
                    setFormData({ ...formData, cancellationHours: parseInt(e.target.value) || 24 })
                  }
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">hours before appointment</span>
              </div>
            </div>
          )}
        </div>

        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailNotif">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive email alerts for new bookings and cancellations
            </p>
          </div>
          <Switch
            id="emailNotif"
            checked={formData.emailNotifications}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, emailNotifications: checked })
            }
          />
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
