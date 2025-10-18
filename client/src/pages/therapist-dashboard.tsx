import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye, Edit, CheckCircle, Clock, XCircle, User } from "lucide-react";
import { type Therapist } from "@shared/schema";

export default function TherapistDashboard() {
  const { data: profile, isLoading } = useQuery<Therapist>({
    queryKey: ["/api/therapist/profile"],
  });

  const calculateProfileCompletion = (profile: Therapist | undefined): number => {
    if (!profile) return 0;
    
    const fields = [
      profile.firstName,
      profile.lastName,
      profile.email,
      profile.city,
      profile.state,
      profile.zipCode,
      profile.licenseNumber,
      profile.licenseState,
      profile.bio,
      profile.topSpecialties?.length > 0,
      profile.individualSessionFee,
      profile.modalities?.length > 0,
    ];
    
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-chart-3">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="default" className="bg-chart-4">
            <Clock className="mr-1 h-3 w-3" />
            Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return null;
    }
  };

  const completion = calculateProfileCompletion(profile);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.firstName || "Therapist"}
            </p>
          </div>
          {profile && getStatusBadge(profile.profileStatus)}
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{completion}%</div>
              <Progress value={completion} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {completion < 100 ? "Complete your profile to go live" : "Your profile is complete!"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.profileViews || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Total profile views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{profile?.profileStatus || "N/A"}</div>
              <p className="text-xs text-muted-foreground mt-2">Profile approval status</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button asChild data-testid="button-edit-profile">
              <Link href="/dashboard/profile">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
            {profile && profile.profileStatus === "approved" && (
              <Button variant="outline" asChild data-testid="button-view-public-profile">
                <Link href={`/therapists/${profile.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Public Profile
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Status Messages */}
        {profile?.profileStatus === "pending" && (
          <Card className="mt-6 border-chart-4">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-chart-4 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Profile Under Review</h3>
                  <p className="text-sm text-muted-foreground">
                    Your profile is currently being reviewed by our team. This typically takes 1-2 business days.
                    You'll receive an email once your profile is approved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {profile?.profileStatus === "rejected" && (
          <Card className="mt-6 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Profile Needs Attention</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your profile was not approved. Please review and update your information, particularly
                    your licensing details, and resubmit for review.
                  </p>
                  <Button asChild size="sm" data-testid="button-resubmit">
                    <Link href="/dashboard/profile">
                      <Edit className="mr-2 h-3 w-3" />
                      Update Profile
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {completion < 100 && (
          <Card className="mt-6 border-primary">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Complete Your Profile</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your profile is {completion}% complete. Complete all required fields to submit for approval
                    and start appearing in search results.
                  </p>
                  <Button asChild size="sm" data-testid="button-complete-profile">
                    <Link href="/dashboard/profile">
                      <Edit className="mr-2 h-3 w-3" />
                      Complete Profile
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
