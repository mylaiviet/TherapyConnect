import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function TherapistSearch() {
  const { form, filters, debouncedFilters, setValue, toggleArrayFilter, clearFilters, filterCount } = useTherapistFilters();
  const { control } = form;

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
    queryKey: ["/api/therapists", debouncedFilters, sortBy], // Use debounced filters for API!
    queryFn: async () => {
      const params = new URLSearchParams();

      // Use debouncedFilters for API params to prevent excessive requests
      if (debouncedFilters.location) params.set("location", debouncedFilters.location);
      if (debouncedFilters.radius) params.set("radius", debouncedFilters.radius.toString());
      if (debouncedFilters.specialties.length) params.set("specialties", debouncedFilters.specialties.join(','));
      if (debouncedFilters.sessionTypes.length) params.set("sessionTypes", debouncedFilters.sessionTypes.join(','));
      if (debouncedFilters.modalities.length) params.set("modalities", debouncedFilters.modalities.join(','));
      if (debouncedFilters.ageGroups.length) params.set("ageGroups", debouncedFilters.ageGroups.join(','));
      if (debouncedFilters.insurance.length) params.set("insurance", debouncedFilters.insurance.join(','));
      if (debouncedFilters.communities.length) params.set("communities", debouncedFilters.communities.join(','));
      if (debouncedFilters.priceMin > 0) params.set("priceMin", debouncedFilters.priceMin.toString());
      if (debouncedFilters.priceMax < 300) params.set("priceMax", debouncedFilters.priceMax.toString());
      if (debouncedFilters.acceptingNewClients) params.set("acceptingNewClients", "true");
      if (sortBy) params.set("sortBy", sortBy);

      const url = `/api/therapists${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch therapists');
      return response.json();
    },
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
  });

  const FilterContent = () => (
    <div className="space-y-4">
      {/* Location Input with react-hook-form Controller */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="location" className="text-sm font-medium mb-2 block">
            Location
          </Label>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                placeholder="City or ZIP code"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="input-filter-location"
              />
            )}
          />
          {filters.location && (
            <div className="mt-4">
              <Label className="text-sm font-medium mb-2 block">
                Radius: {filters.radius} miles
              </Label>
              <Controller
                name="radius"
                control={control}
                render={({ field }) => (
                  <Slider
                    value={[field.value]}
                    onValueChange={([value]) => field.onChange(value)}
                    min={5}
                    max={50}
                    step={5}
                    className="mt-2"
                    data-testid="slider-radius"
                  />
                )}
              />
            </div>
          )}
        </div>

        {/* Accepting New Clients Checkbox */}
        <div className="flex items-center space-x-2">
          <Controller
            name="acceptingNewClients"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="accepting"
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-accepting-clients"
              />
            )}
          />
          <Label htmlFor="accepting" className="text-sm font-medium cursor-pointer">
            Accepting New Clients
          </Label>
        </div>
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
              {(filters.priceMin > 0 || filters.priceMax < 300) && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  ${filters.priceMin}-${filters.priceMax}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <Label className="text-sm text-muted-foreground mb-3 block">
              ${filters.priceMin} - ${filters.priceMax}
            </Label>
            <Controller
              name="priceMin"
              control={control}
              render={({ field: minField }) => (
                <Controller
                  name="priceMax"
                  control={control}
                  render={({ field: maxField }) => (
                    <Slider
                      value={[minField.value, maxField.value]}
                      onValueChange={([min, max]) => {
                        minField.onChange(min);
                        maxField.onChange(max);
                      }}
                      min={0}
                      max={300}
                      step={10}
                      className="mt-2"
                      data-testid="slider-price-range"
                    />
                  )}
                />
              )}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Specializations */}
        <AccordionItem value="specializations">
          <AccordionTrigger className="text-sm font-medium py-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="shrink-0">Specializations</span>
              {filters.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {filters.specialties.slice(0, 2).map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="h-5 px-1.5 text-xs truncate max-w-[120px]">
                      {specialty}
                    </Badge>
                  ))}
                  {filters.specialties.length > 2 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      +{filters.specialties.length - 2}
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
                    checked={filters.specialties.includes(specialty)}
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
              {filters.sessionTypes.length > 0 && (
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {filters.sessionTypes.map((type) => (
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
                    checked={filters.sessionTypes.includes(type)}
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
              {filters.modalities.length > 0 && (
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {filters.modalities.slice(0, 2).map((modality) => (
                    <Badge key={modality} variant="secondary" className="h-5 px-1.5 text-xs capitalize truncate max-w-[100px]">
                      {modality}
                    </Badge>
                  ))}
                  {filters.modalities.length > 2 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      +{filters.modalities.length - 2}
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
                    checked={filters.modalities.includes(modality)}
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
              {filters.ageGroups.length > 0 && (
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {filters.ageGroups.map((age) => (
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
                    checked={filters.ageGroups.includes(age)}
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
              {filters.insurance.length > 0 && (
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {filters.insurance.slice(0, 2).map((insurance) => (
                    <Badge key={insurance} variant="secondary" className="h-5 px-1.5 text-xs truncate max-w-[120px]">
                      {insurance}
                    </Badge>
                  ))}
                  {filters.insurance.length > 2 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      +{filters.insurance.length - 2}
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
                    checked={filters.insurance.includes(insurance)}
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
              {filters.communities.length > 0 && (
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {filters.communities.slice(0, 2).map((community) => (
                    <Badge key={community} variant="secondary" className="h-5 px-1.5 text-xs truncate max-w-[120px]">
                      {community}
                    </Badge>
                  ))}
                  {filters.communities.length > 2 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      +{filters.communities.length - 2}
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
                    checked={filters.communities.includes(community)}
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

      {/* Clear Filters Button */}
      {filterCount > 0 && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full mt-4"
          data-testid="button-clear-filters"
        >
          <X className="mr-2 h-4 w-4" />
          Clear All Filters ({filterCount})
        </Button>
      )}
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
                      {filterCount > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                          {filterCount}
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

            {/* Results Grid */}
            {isLoading ? (
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
            ) : therapists && therapists.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {therapists.map((therapist) => (
                  <Card key={therapist.id} className="hover-elevate active-elevate-2" data-testid={`card-therapist-${therapist.id}`}>
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
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-lg text-muted-foreground mb-4">
                  No therapists found matching your criteria
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Try adjusting your filters or broadening your search
                </p>
                <Button onClick={clearFilters} data-testid="button-clear-filters-empty">
                  Clear Filters
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
