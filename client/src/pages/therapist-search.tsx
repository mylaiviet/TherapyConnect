import { useState } from "react";
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

export default function TherapistSearch() {
  const [filters, setFilters] = useState({
    location: "",
    radius: 25,
    specialties: [] as string[],
    sessionTypes: [] as string[],
    modalities: [] as string[],
    ageGroups: [] as string[],
    insurance: [] as string[],
    communities: [] as string[],
    priceMin: 0,
    priceMax: 300,
    acceptingNewClients: false,
  });

  const [sortBy, setSortBy] = useState("relevance");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: therapists, isLoading } = useQuery<Therapist[]>({
    queryKey: ["/api/therapists", filters, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.location) params.set("location", filters.location);
      if (filters.radius) params.set("radius", filters.radius.toString());
      if (filters.specialties.length) params.set("specialties", filters.specialties.join(','));
      if (filters.sessionTypes.length) params.set("sessionTypes", filters.sessionTypes.join(','));
      if (filters.modalities.length) params.set("modalities", filters.modalities.join(','));
      if (filters.ageGroups.length) params.set("ageGroups", filters.ageGroups.join(','));
      if (filters.insurance.length) params.set("insurance", filters.insurance.join(','));
      if (filters.communities.length) params.set("communities", filters.communities.join(','));
      if (filters.priceMin > 0) params.set("priceMin", filters.priceMin.toString());
      if (filters.priceMax < 300) params.set("priceMax", filters.priceMax.toString());
      if (filters.acceptingNewClients) params.set("acceptingNewClients", "true");
      if (sortBy) params.set("sortBy", sortBy);

      const url = `/api/therapists${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch therapists');
      return response.json();
    },
  });

  const toggleArrayFilter = (key: keyof typeof filters, value: string) => {
    const current = filters[key] as string[];
    setFilters({
      ...filters,
      [key]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  };

  const clearFilters = () => {
    setFilters({
      location: "",
      radius: 25,
      specialties: [],
      sessionTypes: [],
      modalities: [],
      ageGroups: [],
      insurance: [],
      communities: [],
      priceMin: 0,
      priceMax: 300,
      acceptingNewClients: false,
    });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Location Filter */}
      <div>
        <Label htmlFor="location" className="text-sm font-medium mb-2 block">
          Location
        </Label>
        <Input
          id="location"
          type="text"
          placeholder="City or ZIP code"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          data-testid="input-filter-location"
        />
        {filters.location && (
          <div className="mt-4">
            <Label className="text-sm font-medium mb-2 block">
              Radius: {filters.radius} miles
            </Label>
            <Slider
              value={[filters.radius]}
              onValueChange={([value]) => setFilters({ ...filters, radius: value })}
              min={5}
              max={50}
              step={5}
              className="mt-2"
              data-testid="slider-radius"
            />
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="accepting"
            checked={filters.acceptingNewClients}
            onCheckedChange={(checked) =>
              setFilters({ ...filters, acceptingNewClients: !!checked })
            }
            data-testid="checkbox-accepting-clients"
          />
          <Label htmlFor="accepting" className="text-sm font-medium cursor-pointer">
            Accepting New Clients
          </Label>
        </div>
      </div>

      {/* Price Range */}
      <div className="border-t pt-4">
        <Label className="text-sm font-medium mb-2 block">
          Session Fee: ${filters.priceMin} - ${filters.priceMax}
        </Label>
        <Slider
          value={[filters.priceMin, filters.priceMax]}
          onValueChange={([min, max]) =>
            setFilters({ ...filters, priceMin: min, priceMax: max })
          }
          min={0}
          max={300}
          step={10}
          className="mt-2"
          data-testid="slider-price-range"
        />
      </div>

      {/* Specializations */}
      <div className="border-t pt-4">
        <Label className="text-sm font-medium mb-3 block">Specializations</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {SPECIALTIES.slice(0, 10).map((specialty) => (
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
      </div>

      {/* Session Types */}
      <div className="border-t pt-4">
        <Label className="text-sm font-medium mb-3 block">Session Type</Label>
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
      </div>

      {/* Modalities */}
      <div className="border-t pt-4">
        <Label className="text-sm font-medium mb-3 block">Modality</Label>
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
      </div>

      {/* Age Groups */}
      <div className="border-t pt-4">
        <Label className="text-sm font-medium mb-3 block">Age Groups Served</Label>
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
      </div>

      {/* Insurance */}
      <div className="border-t pt-4">
        <Label className="text-sm font-medium mb-3 block">Insurance Accepted</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {INSURANCE_PROVIDERS.slice(0, 8).map((insurance) => (
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
      </div>

      {/* Communities Served */}
      <div className="border-t pt-4">
        <Label className="text-sm font-medium mb-3 block">Community Focus</Label>
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
      </div>

      <Button
        variant="outline"
        onClick={clearFilters}
        className="w-full"
        data-testid="button-clear-filters"
      >
        <X className="mr-2 h-4 w-4" />
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
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
