import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  Clock,
  DollarSign,
  GraduationCap,
  Award,
  Users,
  Calendar,
} from "lucide-react";
import { type Therapist } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookingCalendar } from "@/components/scheduling/BookingCalendar";

export default function TherapistProfile() {
  const [, params] = useRoute("/therapists/:id");
  const therapistId = params?.id;

  const { data: therapist, isLoading } = useQuery<Therapist>({
    queryKey: ["/api/therapists", therapistId],
    queryFn: async () => {
      const response = await fetch(`/api/therapists/${therapistId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Therapist not found');
        throw new Error('Failed to fetch therapist');
      }
      return response.json();
    },
    enabled: !!therapistId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="flex gap-6">
                <Skeleton className="h-48 w-48 rounded-2xl" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-56" />
                  <Skeleton className="h-10 w-40" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <h1 className="text-2xl font-bold mb-4">Therapist Not Found</h1>
          <p className="text-muted-foreground">This therapist profile does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-48 w-48 rounded-2xl">
                <AvatarImage src={therapist.photoUrl || undefined} alt={`${therapist.firstName} ${therapist.lastName}`} />
                <AvatarFallback className="rounded-2xl text-4xl">
                  {therapist.firstName[0]}{therapist.lastName[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2" data-testid="text-therapist-name">
                  {therapist.firstName} {therapist.lastName}
                  {therapist.credentials && <span className="text-2xl text-muted-foreground ml-2">{therapist.credentials}</span>}
                </h1>

                {therapist.practiceName && (
                  <p className="text-lg text-muted-foreground mb-3">{therapist.practiceName}</p>
                )}

                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{therapist.city}, {therapist.state}</span>
                  </div>
                  {therapist.yearsInPractice && (
                    <div className="flex items-center text-muted-foreground">
                      <Award className="h-4 w-4 mr-1" />
                      <span>{therapist.yearsInPractice} years experience</span>
                    </div>
                  )}
                </div>

                {therapist.acceptingNewClients && (
                  <Badge variant="default" className="bg-chart-3 hover:bg-chart-3/90 mb-4">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Accepting New Clients
                  </Badge>
                )}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" data-testid="button-contact-therapist">
                      <Mail className="mr-2 h-5 w-5" />
                      Contact Therapist
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Contact Information</DialogTitle>
                      <DialogDescription>
                        Reach out to {therapist.firstName} {therapist.lastName} directly
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <a href={`mailto:${therapist.email}`} className="text-primary hover:underline" data-testid="link-email">
                            {therapist.email}
                          </a>
                        </div>
                      </div>
                      {therapist.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <a href={`tel:${therapist.phone}`} className="text-primary hover:underline" data-testid="link-phone">
                              {therapist.phone}
                            </a>
                          </div>
                        </div>
                      )}
                      {therapist.website && (
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Website</p>
                            <a href={therapist.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" data-testid="link-website">
                              {therapist.website}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="about" data-testid="tab-about">About</TabsTrigger>
                <TabsTrigger value="specialties" data-testid="tab-specialties">Specialties</TabsTrigger>
                <TabsTrigger value="qualifications" data-testid="tab-qualifications">Qualifications</TabsTrigger>
                <TabsTrigger value="fees" data-testid="tab-fees">Fees & Insurance</TabsTrigger>
                <TabsTrigger value="booking" data-testid="tab-booking">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About Me</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {therapist.bio && (
                      <div>
                        <h3 className="font-semibold mb-2">Biography</h3>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {therapist.bio}
                        </p>
                      </div>
                    )}

                    {therapist.therapeuticApproach && (
                      <div>
                        <h3 className="font-semibold mb-2">Therapeutic Approach</h3>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {therapist.therapeuticApproach}
                        </p>
                      </div>
                    )}

                    {therapist.treatmentOrientation && (
                      <div>
                        <h3 className="font-semibold mb-2">Treatment Orientation</h3>
                        <p className="text-muted-foreground">{therapist.treatmentOrientation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="specialties" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Specializations & Expertise</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {therapist.topSpecialties && therapist.topSpecialties.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Top Specialties</h3>
                        <div className="flex flex-wrap gap-2">
                          {therapist.topSpecialties.map((specialty) => (
                            <Badge key={specialty} variant="default">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {therapist.issuesTreated && therapist.issuesTreated.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Issues Treated</h3>
                        <div className="flex flex-wrap gap-2">
                          {therapist.issuesTreated.map((issue) => (
                            <Badge key={issue} variant="secondary">
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {therapist.therapyTypes && therapist.therapyTypes.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Therapy Approaches</h3>
                        <div className="flex flex-wrap gap-2">
                          {therapist.therapyTypes.map((type) => (
                            <Badge key={type} variant="outline">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {therapist.communitiesServed && therapist.communitiesServed.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Communities Served</h3>
                        <div className="flex flex-wrap gap-2">
                          {therapist.communitiesServed.map((community) => (
                            <Badge key={community} variant="secondary">
                              {community}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="qualifications" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Qualifications & Licensing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {therapist.licenseType && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">License Type</p>
                          <p className="font-medium">{therapist.licenseType}</p>
                        </div>
                      )}
                      {therapist.licenseState && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Licensed In</p>
                          <p className="font-medium">{therapist.licenseState}</p>
                        </div>
                      )}
                      {therapist.graduateSchool && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Graduate School</p>
                          <p className="font-medium">{therapist.graduateSchool}</p>
                        </div>
                      )}
                      {therapist.graduationYear && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Graduation Year</p>
                          <p className="font-medium">{therapist.graduationYear}</p>
                        </div>
                      )}
                    </div>

                    {therapist.languagesSpoken && therapist.languagesSpoken.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Languages Spoken</h3>
                        <div className="flex flex-wrap gap-2">
                          {therapist.languagesSpoken.map((language) => (
                            <Badge key={language} variant="outline">
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fees" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Fees & Insurance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {therapist.individualSessionFee && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Individual Session</p>
                          <p className="text-2xl font-bold text-primary">${therapist.individualSessionFee}</p>
                        </div>
                      )}
                      {therapist.couplesSessionFee && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Couples Session</p>
                          <p className="text-2xl font-bold text-primary">${therapist.couplesSessionFee}</p>
                        </div>
                      )}
                    </div>

                    {therapist.offersSlidingScale && (
                      <div className="bg-secondary/10 p-4 rounded-lg">
                        <p className="font-semibold mb-1">Sliding Scale Available</p>
                        <p className="text-sm text-muted-foreground">
                          Reduced fees from ${therapist.slidingScaleMin} available for qualifying clients
                        </p>
                      </div>
                    )}

                    {therapist.insuranceAccepted && therapist.insuranceAccepted.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Insurance Accepted</h3>
                        <div className="flex flex-wrap gap-2">
                          {therapist.insuranceAccepted.map((insurance) => (
                            <Badge key={insurance} variant="secondary">
                              {insurance}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {therapist.paymentMethods && therapist.paymentMethods.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Payment Methods</h3>
                        <div className="flex flex-wrap gap-2">
                          {therapist.paymentMethods.map((method) => (
                            <Badge key={method} variant="outline" className="capitalize">
                              {method}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="booking" className="mt-6">
                <BookingCalendar
                  therapistId={therapist.userId}
                  therapistName={`${therapist.firstName} ${therapist.lastName}`}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Facts */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Facts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {therapist.sessionTypes && therapist.sessionTypes.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Session Types</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {therapist.sessionTypes.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs capitalize">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {therapist.modalities && therapist.modalities.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Modalities</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {therapist.modalities.map((modality) => (
                        <Badge key={modality} variant="outline" className="text-xs capitalize">
                          {modality}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {therapist.ageGroups && therapist.ageGroups.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Age Groups</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {therapist.ageGroups.map((age) => (
                        <Badge key={age} variant="outline" className="text-xs capitalize">
                          {age}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Availability */}
            {therapist.availableDays && therapist.availableDays.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Availability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Available Days</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {therapist.availableDays.map((day) => (
                        <Badge key={day} variant="outline" className="text-xs capitalize">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {therapist.availableTimes && therapist.availableTimes.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Available Times</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {therapist.availableTimes.map((time) => (
                          <Badge key={time} variant="outline" className="text-xs capitalize">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {therapist.waitlistStatus && (
                    <div className="bg-chart-4/10 p-3 rounded-lg">
                      <p className="text-sm font-medium text-chart-4">Waitlist Available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
