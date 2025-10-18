import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChevronLeft, ChevronRight, Save, Check, X } from "lucide-react";
import {
  type Therapist,
  insertTherapistSchema,
  US_STATES,
  LICENSE_TYPES,
  SPECIALTIES,
  THERAPY_TYPES,
  SESSION_TYPES,
  MODALITIES,
  AGE_GROUPS,
  COMMUNITIES_SERVED,
  INSURANCE_PROVIDERS,
  PAYMENT_METHODS,
  DAYS_OF_WEEK,
  TIME_SLOTS,
} from "@shared/schema";

const STEPS = [
  { id: 1, title: "Basic Information", description: "Personal details and contact" },
  { id: 2, title: "Practice Details", description: "Specializations and approach" },
  { id: 3, title: "Licensing", description: "Credentials and verification" },
  { id: 4, title: "Fees & Logistics", description: "Pricing and availability" },
  { id: 5, title: "Review & Submit", description: "Final review" },
];

export default function ProfileEditor() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: profile } = useQuery<Therapist>({
    queryKey: ["/api/therapist/profile"],
  });

  const form = useForm<any>({
    defaultValues: {
      firstName: "",
      lastName: "",
      credentials: "",
      email: "",
      phone: "",
      website: "",
      practiceName: "",
      pronouns: "",
      languagesSpoken: [],
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      bio: "",
      therapeuticApproach: "",
      topSpecialties: [],
      issuesTreated: [],
      therapyTypes: [],
      treatmentOrientation: "",
      sessionTypes: [],
      modalities: [],
      ageGroups: [],
      communitiesServed: [],
      licenseType: "",
      licenseNumber: "",
      licenseState: "",
      npiNumber: "",
      yearsInPractice: 0,
      graduateSchool: "",
      graduationYear: undefined,
      individualSessionFee: undefined,
      couplesSessionFee: undefined,
      offersSlidingScale: false,
      slidingScaleMin: undefined,
      insuranceAccepted: [],
      paymentMethods: [],
      availableDays: [],
      availableTimes: [],
      waitlistStatus: false,
      acceptingNewClients: true,
    },
  });

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      form.reset({
        ...profile,
        yearsInPractice: profile.yearsInPractice || 0,
      });
    }
  }, [profile, form]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (profile?.id) {
        return apiRequest("PUT", `/api/therapist/profile/${profile.id}`, data);
      } else {
        return apiRequest("POST", "/api/therapist/profile", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/therapist/profile"] });
      toast({
        title: "Profile saved",
        description: "Your changes have been saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving profile",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/therapist/profile/submit", data),
    onSuccess: () => {
      toast({
        title: "Profile submitted",
        description: "Your profile has been submitted for review",
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting profile",
        description: error.message || "Failed to submit profile",
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = () => {
    const data = form.getValues();
    saveMutation.mutate(data);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const data = form.getValues();
    submitMutation.mutate(data);
  };

  const MultiSelectBadges = ({ 
    value, 
    options, 
    onChange,
    name
  }: { 
    value: string[]; 
    options: readonly string[]; 
    onChange: (value: string[]) => void;
    name: string;
  }) => {
    const toggle = (item: string) => {
      const newValue = value.includes(item)
        ? value.filter((v) => v !== item)
        : [...value, item];
      onChange(newValue);
    };

    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Badge
            key={option}
            variant={value.includes(option) ? "default" : "outline"}
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={() => toggle(option)}
            data-testid={`badge-${name}-${option.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {value.includes(option) && <Check className="mr-1 h-3 w-3" />}
            {option}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>
          
          {/* Step Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      currentStep >= step.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        currentStep > step.id ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <h2 className="text-xl font-semibold">{STEPS[currentStep - 1].title}</h2>
              <p className="text-sm text-muted-foreground">{STEPS[currentStep - 1].description}</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <Card>
            <CardContent className="pt-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="credentials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credentials</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., LCSW, PhD" data-testid="input-credentials" />
                        </FormControl>
                        <FormDescription>Your professional credentials (e.g., LCSW, PhD, LMFT)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://" data-testid="input-website" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="practiceName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Practice Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-practice-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-state">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {US_STATES.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-zip" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Practice Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biography</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={6}
                            placeholder="Tell potential clients about yourself, your approach to therapy, and what they can expect from working with you..."
                            data-testid="textarea-bio"
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0} characters (recommended: 300-500 words)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="therapeuticApproach"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Therapeutic Approach</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={4}
                            placeholder="Describe your therapeutic approach and methodology..."
                            data-testid="textarea-approach"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="topSpecialties"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Top Specialties (Select up to 5)</FormLabel>
                        <FormControl>
                          <MultiSelectBadges
                            value={field.value || []}
                            options={SPECIALTIES}
                            onChange={field.onChange}
                            name="specialty"
                          />
                        </FormControl>
                        <FormDescription>Choose your main areas of expertise</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="therapyTypes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Therapy Types</FormLabel>
                        <FormControl>
                          <MultiSelectBadges
                            value={field.value || []}
                            options={THERAPY_TYPES}
                            onChange={field.onChange}
                            name="therapy-type"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sessionTypes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Types Offered</FormLabel>
                        <FormControl>
                          <MultiSelectBadges
                            value={field.value || []}
                            options={SESSION_TYPES}
                            onChange={field.onChange}
                            name="session-type"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="modalities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modalities</FormLabel>
                        <FormControl>
                          <MultiSelectBadges
                            value={field.value || []}
                            options={MODALITIES}
                            onChange={field.onChange}
                            name="modality"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ageGroups"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age Groups Served</FormLabel>
                        <FormControl>
                          <MultiSelectBadges
                            value={field.value || []}
                            options={AGE_GROUPS}
                            onChange={field.onChange}
                            name="age-group"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3: Licensing */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="licenseType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-license-type">
                                <SelectValue placeholder="Select license type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LICENSE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-license-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="licenseState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License State *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-license-state">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {US_STATES.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="npiNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NPI Number</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-npi" />
                          </FormControl>
                          <FormDescription>Optional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="yearsInPractice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years in Practice</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-years-practice"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="graduationYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Graduation Year</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              data-testid="input-graduation-year"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="graduateSchool"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Graduate School</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-graduate-school" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 4: Fees & Logistics */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="individualSessionFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Individual Session Fee ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              data-testid="input-individual-fee"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="couplesSessionFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Couples Session Fee ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              data-testid="input-couples-fee"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="offersSlidingScale"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-sliding-scale"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer">Offer Sliding Scale</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch("offersSlidingScale") && (
                    <FormField
                      control={form.control}
                      name="slidingScaleMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sliding Scale Minimum ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              data-testid="input-sliding-scale-min"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="insuranceAccepted"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance Accepted</FormLabel>
                        <FormControl>
                          <MultiSelectBadges
                            value={field.value || []}
                            options={INSURANCE_PROVIDERS}
                            onChange={field.onChange}
                            name="insurance"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethods"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Methods</FormLabel>
                        <FormControl>
                          <MultiSelectBadges
                            value={field.value || []}
                            options={PAYMENT_METHODS}
                            onChange={field.onChange}
                            name="payment"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availableDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Days</FormLabel>
                        <FormControl>
                          <MultiSelectBadges
                            value={field.value || []}
                            options={DAYS_OF_WEEK}
                            onChange={field.onChange}
                            name="day"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availableTimes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Times</FormLabel>
                        <FormControl>
                          <MultiSelectBadges
                            value={field.value || []}
                            options={TIME_SLOTS}
                            onChange={field.onChange}
                            name="time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="acceptingNewClients"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-accepting-clients"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer">Accepting New Clients</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Review & Submit */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="bg-primary/5 p-6 rounded-lg">
                    <h3 className="font-semibold text-lg mb-4">Profile Summary</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">
                          {form.watch("firstName")} {form.watch("lastName")} {form.watch("credentials")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">
                          {form.watch("city")}, {form.watch("state")} {form.watch("zipCode")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">License</p>
                        <p className="font-medium">
                          {form.watch("licenseType")} - {form.watch("licenseNumber")} ({form.watch("licenseState")})
                        </p>
                      </div>
                      {form.watch("topSpecialties")?.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Specialties</p>
                          <div className="flex flex-wrap gap-2">
                            {form.watch("topSpecialties").map((s: string) => (
                              <Badge key={s}>{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-secondary/5 p-6 rounded-lg">
                    <h3 className="font-semibold mb-2">Ready to Submit?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Once you submit your profile, it will be reviewed by our admin team. This typically takes 1-2 business days. 
                      You'll receive an email notification once your profile is approved.
                    </p>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={submitMutation.isPending}
                      data-testid="button-submit-profile"
                    >
                      {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              data-testid="button-previous"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saveMutation.isPending}
              data-testid="button-save-draft"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : "Save Draft"}
            </Button>

            {currentStep < STEPS.length && (
              <Button onClick={handleNext} data-testid="button-next">
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </Form>
      </div>
    </div>
  );
}
