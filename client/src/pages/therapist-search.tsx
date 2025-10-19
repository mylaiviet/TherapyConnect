import React, { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MapPin, DollarSign, CheckCircle, Filter, X } from "lucide-react";
import { Link } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  SPECIALTIES,
  SESSION_TYPES,
  MODALITIES,
  AGE_GROUPS,
  INSURANCE_PROVIDERS,
  COMMUNITIES_SERVED,
  type Therapist
} from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTherapistFilters } from "@/hooks/useTherapistFilters";

// Isolated input component with local state to prevent parent re-renders
const LocationInput = React.memo(({
  value: initialValue,
  onChange,
  placeholder,
  className,
  maxLength,
  type = "text",
  testId,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  type?: string;
  testId?: string;
}) => {
  const [localValue, setLocalValue] = useState(initialValue);
  const onChangeRef = useRef(onChange);

  // Update ref when onChange changes
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync with parent when prop changes (e.g., Clear Filters clicked)
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  // CRITICAL FIX: Debounce the parent update to prevent massive re-renders
  const debouncedUpdate = useMemo(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    return (value: string) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        onChangeRef.current(value);  // Only update parent after 300ms of no typing
      }, 300);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);      // ✅ Instant local update (zero lag)
    debouncedUpdate(newValue);    // ✅ Parent updates after 300ms (prevents re-renders)
  };

  return (
    <Input
      type={type}
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      maxLength={maxLength}
      data-testid={testId}
    />
  );
});

LocationInput.displayName = "LocationInput";

// Memoized therapist card to prevent unnecessary re-renders
const TherapistCard = React.memo(({ therapist }: { therapist: Therapist }) => {
  return (
    <Card className="hover-elevate active-elevate-2" data-testid={`card-therapist-${therapist.id}`}>
      <CardContent className="p-6">
        <div className="flex gap-4 mb-4">
          <Avatar className="h-24 w-24 rounded-lg">
            <AvatarImage src={therapist.photoUrl || undefined} alt={`${therapist.firstName} ${therapist.lastName}`} />
            <AvatarFallback className="rounded-lg text-lg">
              {therapist.firstName[0]}{therapist.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1" data-testid={`text-name-${therapist.id}`}>
              {therapist.firstName} {therapist.lastName}
            </h3>
            {therapist.credentials && (
              <p className="text-sm text-muted-foreground mb-2">
                {therapist.credentials}
              </p>
            )}
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              {therapist.city}, {therapist.state}
            </div>
          </div>
        </div>

        {therapist.topSpecialties && therapist.topSpecialties.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {therapist.topSpecialties.slice(0, 3).map((specialty) => (
              <Badge key={specialty} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4 text-sm">
          {therapist.individualSessionFee && (
            <div className="flex items-center text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">{therapist.individualSessionFee}</span>
              <span className="ml-1">/ session</span>
            </div>
          )}
          {therapist.acceptingNewClients && (
            <Badge variant="default" className="bg-chart-3 hover:bg-chart-3/90">
              <CheckCircle className="h-3 w-3 mr-1" />
              Accepting
            </Badge>
          )}
        </div>

        <Button asChild className="w-full" data-testid={`button-view-profile-${therapist.id}`}>
          <Link href={`/therapists/${therapist.id}`}>View Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
});

TherapistCard.displayName = "TherapistCard";

// Memoized results list to prevent re-renders during typing
const TherapistResultsList = React.memo(({
  therapists,
  isLoading,
  onClearFilters,
}: {
  therapists?: Therapist[];
  isLoading: boolean;
  onClearFilters: () => void;
}) => {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex gap-4 mb-4">
                <Skeleton className="h-24 w-24 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <Skeleton className="h-16 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!therapists || therapists.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-lg text-muted-foreground mb-4">
          No therapists found matching your criteria
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Try adjusting your filters or broadening your search
        </p>
        <Button onClick={onClearFilters} data-testid="button-clear-filters-empty">
          Clear Filters
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      {therapists.map((therapist) => (
        <TherapistCard key={therapist.id} therapist={therapist} />
      ))}
    </div>
  );
});

TherapistResultsList.displayName = "TherapistResultsList";

export default function TherapistSearch() {
  const {
    inputValues,
    appliedFilters,
    updateField,
    toggleArrayFilter,
    clearFilters,
    applyFilters,
    inputFilterCount,
    appliedFilterCount,
    hasUnappliedChanges,
    hasLocation
  } = useTherapistFilters();

  const [sortBy, setSortBy] = useState("relevance");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<string[]>(["price"]);
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const savedScrollPosition = useRef<number>(0);

  // Preserve scroll position when filters change
  useEffect(() => {
    const scrollContainer = filterScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      savedScrollPosition.current = scrollContainer.scrollTop;
    };

    scrollContainer.addEventListener('scroll', handleScroll);

    if (savedScrollPosition.current > 0) {
      scrollContainer.scrollTop = savedScrollPosition.current;
    }

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []); // FIXED: Added empty dependency array to prevent running on every render

  const { data: therapists, isLoading } = useQuery<Therapist[]>({
    // Use appliedFilters - only updates when user clicks "Apply Filters" button
    // This prevents refetch while typing, eliminating all input lag
    queryKey: [
      "/api/therapists",
      appliedFilters.streetAddress,
      appliedFilters.city,
      appliedFilters.state,
      appliedFilters.zipCode,
      appliedFilters.radius,
      appliedFilters.specialties.slice().sort().join(','),
      appliedFilters.sessionTypes.slice().sort().join(','),
      appliedFilters.modalities.slice().sort().join(','),
      appliedFilters.ageGroups.slice().sort().join(','),
      appliedFilters.insurance.slice().sort().join(','),
      appliedFilters.communities.slice().sort().join(','),
      appliedFilters.priceMin,
      appliedFilters.priceMax,
      appliedFilters.acceptingNewClients,
      sortBy,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Location parameters - use appliedFilters
      if (appliedFilters.streetAddress) params.set("streetAddress", appliedFilters.streetAddress);
      if (appliedFilters.city) params.set("city", appliedFilters.city);
      if (appliedFilters.state) params.set("state", appliedFilters.state);
      if (appliedFilters.zipCode) params.set("zipCode", appliedFilters.zipCode);
      if (appliedFilters.radius && hasLocation) params.set("radius", appliedFilters.radius.toString());

      // Other filter parameters - use appliedFilters
      if (appliedFilters.specialties.length) params.set("specialties", appliedFilters.specialties.join(','));
      if (appliedFilters.sessionTypes.length) params.set("sessionTypes", appliedFilters.sessionTypes.join(','));
      if (appliedFilters.modalities.length) params.set("modalities", appliedFilters.modalities.join(','));
      if (appliedFilters.ageGroups.length) params.set("ageGroups", appliedFilters.ageGroups.join(','));
      if (appliedFilters.insurance.length) params.set("insurance", appliedFilters.insurance.join(','));
      if (appliedFilters.communities.length) params.set("communities", appliedFilters.communities.join(','));
      if (appliedFilters.priceMin > 0) params.set("priceMin", appliedFilters.priceMin.toString());
      if (appliedFilters.priceMax < 300) params.set("priceMax", appliedFilters.priceMax.toString());
      if (appliedFilters.acceptingNewClients) params.set("acceptingNewClients", "true");
      if (sortBy) params.set("sortBy", sortBy);

      const url = `/api/therapists${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch therapists');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent background refetches
    gcTime: 300000,
    refetchOnWindowFocus: false,
    notifyOnChangeProps: ['data', 'error', 'isLoading'], // Only trigger re-render on these prop changes
  });

  const FilterContent = () => (
    <div className="space-y-4">
      {/* Location Filter Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Location</Label>

        {/* Street Address */}
        <LocationInput
          value={inputValues.streetAddress}
          onChange={(value) => updateField("streetAddress", value)}
          placeholder="Street Address (optional)"
          testId="input-filter-street-address"
        />

        {/* City */}
        <LocationInput
          value={inputValues.city}
          onChange={(value) => updateField("city", value)}
          placeholder="City"
          testId="input-filter-city"
        />

        {/* State and ZIP Code in same row */}
        <div className="grid grid-cols-2 gap-2">
          <LocationInput
            value={inputValues.state}
            onChange={(value) => updateField("state", value.toUpperCase())}
            placeholder="State"
            maxLength={2}
            className="uppercase"
            testId="input-filter-state"
          />
          <LocationInput
            value={inputValues.zipCode}
            onChange={(value) => updateField("zipCode", value)}
            placeholder="ZIP Code"
            maxLength={5}
            testId="input-filter-zip-code"
          />
        </div>

        {/* Radius Slider - only show if location is entered */}
        {hasLocation && (
          <div className="mt-3">
            <Label className="text-sm font-medium mb-2 block">
              Search Radius: {inputValues.radius} miles
            </Label>
            <Slider
              value={[inputValues.radius]}
              onValueChange={([value]) => updateField("radius", value)}
              min={5}
              max={100}
              step={5}
              className="mt-2"
              data-testid="slider-radius"
            />
          </div>
        )}
      </div>

      {/* Accepting New Clients Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="accepting"
          checked={inputValues.acceptingNewClients}
          onCheckedChange={(checked) => updateField("acceptingNewClients", !!checked)}
          data-testid="checkbox-accepting-clients"
        />
        <Label htmlFor="accepting" className="text-sm font-medium cursor-pointer">
          Accepting New Clients
        </Label>
      </div>

      {/* Collapsible Filter Sections */}
      <Accordion
        type="multiple"
        className="w-full"
        value={openAccordions}
        onValueChange={setOpenAccordions}
      >
        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium py-3">
            <div className="flex items-center gap-2">
              Session Fee
              {(inputValues.priceMin > 0 || inputValues.priceMax < 300) && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  ${inputValues.priceMin}-${inputValues.priceMax}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <Label className="text-sm text-muted-foreground mb-3 block">
              ${inputValues.priceMin} - ${inputValues.priceMax}
            </Label>
            <Slider
              value={[inputValues.priceMin, inputValues.priceMax]}
              onValueChange={([min, max]) => {
                updateField("priceMin", min);
                updateField("priceMax", max);
              }}
              min={0}
              max={300}
              step={10}
              className="mt-2"
              data-testid="slider-price-range"
            />
          </AccordionContent>
        </AccordionItem>

        {/* Specializations */}
        <AccordionItem value="specializations">
          <AccordionTrigger className="text-sm font-medium py-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="shrink-0">Specializations</span>
              {inputValues.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {inputValues.specialties.slice(0, 2).map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="h-5 px-1.5 text-xs truncate max-w-[120px]">
                      {specialty}
                    </Badge>
                  ))}
                  {inputValues.specialties.length > 2 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      +{inputValues.specialties.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {SPECIALTIES.map((specialty) => (
                <div key={specialty} className="flex items-center space-x-2">
                  <Checkbox
                    id={`specialty-${specialty}`}
                    checked={inputValues.specialties.includes(specialty)}
                    onCheckedChange={() => toggleArrayFilter("specialties", specialty)}
                    data-testid={`checkbox-specialty-${specialty.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <Label
                    htmlFor={`specialty-${specialty}`}
                    className="text-sm cursor-pointer"
                  >
                    {specialty}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Session Types */}
        <AccordionItem value="session-types">
          <AccordionTrigger className="text-sm font-medium py-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="shrink-0">Session Type</span>
              {inputValues.sessionTypes.length > 0 && (
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {inputValues.sessionTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="h-5 px-1.5 text-xs capitalize">
                      {type}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-2">
              {SESSION_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`session-${type}`}
                    checked={inputValues.sessionTypes.includes(type)}
                    onCheckedChange={() => toggleArrayFilter("sessionTypes", type)}
                    data-testid={`checkbox-session-${type}`}
                  />
                  <Label htmlFor={`session-${type}`} className="text-sm cursor-pointer capitalize">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Modalities */}
        <AccordionItem value="modalities">
          <AccordionTrigger className="text-sm font-medium py-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="shrink-0">Therapy Modality</span>
              {inputValues.modalities.length > 0 && (
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {inputValues.modalities.slice(0, 2).map((modality) => (
                    <Badge key={modality} variant="secondary" className="h-5 px-1.5 text-xs capitalize truncate max-w-[100px]">
                      {modality}
                    </Badge>
                  ))}
                  {inputValues.modalities.length > 2 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      +{inputValues.modalities.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-2">
              {MODALITIES.map((modality) => (
                <div key={modality} className="flex items-center space-x-2">
                  <Checkbox
                    id={`modality-${modality}`}
                    checked={inputValues.modalities.includes(modality)}
                    onCheckedChange={() => toggleArrayFilter("modalities", modality)}
                    data-testid={`checkbox-modality-${modality}`}
                  />
                  <Label htmlFor={`modality-${modality}`} className="text-sm cursor-pointer capitalize">
                    {modality}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Age Groups */}
        <AccordionItem value="age-groups">
          <AccordionTrigger className="text-sm font-medium py-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="shrink-0">Age Groups</span>
              {inputValues.ageGroups.length > 0 && (
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {inputValues.ageGroups.map((age) => (
                    <Badge key={age} variant="secondary" className="h-5 px-1.5 text-xs capitalize">
                      {age}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-2">
              {AGE_GROUPS.map((age) => (
                <div key={age} className="flex items-center space-x-2">
                  <Checkbox
                    id={`age-${age}`}
                    checked={inputValues.ageGroups.includes(age)}
                    onCheckedChange={() => toggleArrayFilter("ageGroups", age)}
                    data-testid={`checkbox-age-${age}`}
                  />
                  <Label htmlFor={`age-${age}`} className="text-sm cursor-pointer capitalize">
                    {age}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Insurance */}
        <AccordionItem value="insurance">
          <AccordionTrigger className="text-sm font-medium py-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="shrink-0">Insurance</span>
              {inputValues.insurance.length > 0 && (
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {inputValues.insurance.slice(0, 2).map((insurance) => (
                    <Badge key={insurance} variant="secondary" className="h-5 px-1.5 text-xs truncate max-w-[120px]">
                      {insurance}
                    </Badge>
                  ))}
                  {inputValues.insurance.length > 2 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      +{inputValues.insurance.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {INSURANCE_PROVIDERS.map((insurance) => (
                <div key={insurance} className="flex items-center space-x-2">
                  <Checkbox
                    id={`insurance-${insurance}`}
                    checked={inputValues.insurance.includes(insurance)}
                    onCheckedChange={() => toggleArrayFilter("insurance", insurance)}
                    data-testid={`checkbox-insurance-${insurance.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <Label htmlFor={`insurance-${insurance}`} className="text-sm cursor-pointer">
                    {insurance}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Communities Served */}
        <AccordionItem value="communities">
          <AccordionTrigger className="text-sm font-medium py-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="shrink-0">Community Focus</span>
              {inputValues.communities.length > 0 && (
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {inputValues.communities.slice(0, 2).map((community) => (
                    <Badge key={community} variant="secondary" className="h-5 px-1.5 text-xs truncate max-w-[120px]">
                      {community}
                    </Badge>
                  ))}
                  {inputValues.communities.length > 2 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      +{inputValues.communities.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-2">
              {COMMUNITIES_SERVED.map((community) => (
                <div key={community} className="flex items-center space-x-2">
                  <Checkbox
                    id={`community-${community}`}
                    checked={inputValues.communities.includes(community)}
                    onCheckedChange={() => toggleArrayFilter("communities", community)}
                    data-testid={`checkbox-community-${community.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <Label htmlFor={`community-${community}`} className="text-sm cursor-pointer">
                    {community}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Apply Filters Button */}
      <div className="mt-6 space-y-2">
        <Button
          onClick={applyFilters}
          className={`w-full ${hasUnappliedChanges ? 'bg-primary animate-pulse' : 'bg-primary'}`}
          size="lg"
          data-testid="button-apply-filters"
        >
          Apply Filters
          {inputFilterCount > 0 && ` (${inputFilterCount})`}
        </Button>

        {/* Clear Filters Button */}
        {inputFilterCount > 0 && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="w-full"
            data-testid="button-clear-filters"
          >
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div ref={filterScrollRef} className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-6">Filters</h2>
                  <FilterContent />
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header with Sort and Mobile Filter */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Find Your Therapist</h1>
                <p className="text-muted-foreground">
                  {isLoading ? "Loading..." : `${therapists?.length || 0} therapists found`}
                </p>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                {/* Mobile Filter Button */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden flex-1 sm:flex-none" data-testid="button-mobile-filters">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                      {appliedFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                          {appliedFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48" data-testid="select-sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="price-low">Price (Low to High)</SelectItem>
                    <SelectItem value="price-high">Price (High to Low)</SelectItem>
                    <SelectItem value="recent">Recently Joined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Grid - Memoized to prevent re-renders during typing */}
            <TherapistResultsList
              therapists={therapists}
              isLoading={isLoading}
              onClearFilters={clearFilters}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
