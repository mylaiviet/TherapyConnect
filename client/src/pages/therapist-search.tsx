import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MapPin, DollarSign, CheckCircle, Filter, X, Search, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  SPECIALTIES,
  SESSION_TYPES,
  MODALITIES,
  AGE_GROUPS,
  INSURANCE_PROVIDERS,
  COMMUNITIES_SERVED,
  GENDER_OPTIONS,
  CERTIFICATIONS,
  SESSION_LENGTHS,
  VIRTUAL_PLATFORMS,
  type Therapist
} from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTherapistFilters } from "@/hooks/useTherapistFilters";
import { LocationFields } from "@/components/LocationFields";

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

// Removed filter presets - users will manually select their filters

// Searchable multi-select for long lists
const SearchableCheckboxList = React.memo(({
  items,
  selectedItems,
  onToggle,
  placeholder = "Search...",
  testIdPrefix,
}: {
  items: string[];
  selectedItems: string[];
  onToggle: (item: string) => void;
  placeholder?: string;
  testIdPrefix?: string;
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter(item =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  return (
    <Command className="border rounded-md">
      <CommandInput
        placeholder={placeholder}
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup className="max-h-64 overflow-auto">
          {filteredItems.map((item) => (
            <CommandItem
              key={item}
              onSelect={() => onToggle(item)}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <Checkbox
                id={`${testIdPrefix}-${item}`}
                checked={selectedItems.includes(item)}
                onCheckedChange={() => onToggle(item)}
                data-testid={testIdPrefix ? `checkbox-${testIdPrefix}-${item.toLowerCase().replace(/\s+/g, '-')}` : undefined}
              />
              <Label
                htmlFor={`${testIdPrefix}-${item}`}
                className="text-sm cursor-pointer flex-1"
              >
                {item}
              </Label>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
});

SearchableCheckboxList.displayName = "SearchableCheckboxList";

// Memoized FilterContent component to prevent re-renders on every filter change
const FilterContent = React.memo(({
  filters,
  control,
  setValue,
  toggleArrayFilter,
  clearFilters,
  filterCount,
}: {
  filters: any;
  control: any;
  setValue: any;
  toggleArrayFilter: any;
  clearFilters: () => void;
  filterCount: number;
}) => (
  <div className="space-y-4">
    {/* Accordion Filter Interface */}
    <Accordion type="multiple" defaultValue={["location"]} className="w-full">

      {/* Location & Basics */}
      <AccordionItem value="location">
        <AccordionTrigger className="text-sm font-semibold">
          Location & Availability {(filters.city || filters.zipCode || filters.acceptingNewClients || filters.availableImmediately) && `(${[filters.city, filters.zipCode, filters.acceptingNewClients, filters.availableImmediately].filter(Boolean).length})`}
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div>
            <LocationFields
              street={filters.street}
              city={filters.city}
              state={filters.state}
              zipCode={filters.zipCode}
              onStreetChange={(value) => setValue('street', value)}
              onCityChange={(value) => setValue('city', value)}
              onStateChange={(value) => setValue('state', value)}
              onZipCodeChange={(value) => setValue('zipCode', value)}
            />
            {(filters.city || filters.zipCode) && (
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">
                  Search Radius: {filters.radius} miles
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

          <div className="flex items-center space-x-2">
            <Controller
              name="availableImmediately"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="available-immediately"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-available-immediately"
                />
              )}
            />
            <Label htmlFor="available-immediately" className="text-sm font-medium cursor-pointer">
              Available Immediately
            </Label>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Price */}
      <AccordionItem value="price">
        <AccordionTrigger className="text-sm font-semibold">
          Session Fee {(filters.priceMin > 0 || filters.priceMax < 300) && `($${filters.priceMin}-$${filters.priceMax})`}
        </AccordionTrigger>
        <AccordionContent>
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Session Fee: ${filters.priceMin} - ${filters.priceMax}
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
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Specializations & Modalities */}
      <AccordionItem value="specializations">
        <AccordionTrigger className="text-sm font-semibold">
          Specializations & Therapy Type {(filters.specialties.length > 0 || filters.modalities.length > 0 || filters.gender.length > 0 || filters.certifications.length > 0) && `(${filters.specialties.length + filters.modalities.length + filters.gender.length + filters.certifications.length})`}
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Specializations {filters.specialties.length > 0 && `(${filters.specialties.length})`}
          </Label>
          <SearchableCheckboxList
            items={SPECIALTIES}
            selectedItems={filters.specialties}
            onToggle={(item) => toggleArrayFilter("specialties", item)}
            placeholder="Search specializations..."
            testIdPrefix="specialty"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">
            Therapy Modality {filters.modalities.length > 0 && `(${filters.modalities.length})`}
          </Label>
          <div className="space-y-2 border rounded-md p-3 max-h-64 overflow-y-auto">
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

        <div>
          <Label className="text-sm font-medium mb-2 block">
            Therapist Gender {filters.gender.length > 0 && `(${filters.gender.length})`}
          </Label>
          <div className="space-y-2 border rounded-md p-3">
            {GENDER_OPTIONS.map((gender) => (
              <div key={gender} className="flex items-center space-x-2">
                <Checkbox
                  id={`gender-${gender}`}
                  checked={filters.gender.includes(gender)}
                  onCheckedChange={() => toggleArrayFilter("gender", gender)}
                  data-testid={`checkbox-gender-${gender.toLowerCase().replace(/\s+/g, '-')}`}
                />
                <Label htmlFor={`gender-${gender}`} className="text-sm cursor-pointer">
                  {gender}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">
            Certifications {filters.certifications.length > 0 && `(${filters.certifications.length})`}
          </Label>
          <SearchableCheckboxList
            items={CERTIFICATIONS}
            selectedItems={filters.certifications}
            onToggle={(item) => toggleArrayFilter("certifications", item)}
            placeholder="Search certifications..."
            testIdPrefix="certification"
          />
        </div>
      </AccordionContent>
      </AccordionItem>

      {/* Session Details */}
      <AccordionItem value="session">
        <AccordionTrigger className="text-sm font-semibold">
          Session Details {(filters.sessionTypes.length > 0 || filters.ageGroups.length > 0 || filters.sessionLengths.length > 0 || filters.virtualPlatforms.length > 0) && `(${filters.sessionTypes.length + filters.ageGroups.length + filters.sessionLengths.length + filters.virtualPlatforms.length})`}
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Session Type {filters.sessionTypes.length > 0 && `(${filters.sessionTypes.length})`}
            </Label>
            <div className="space-y-2 border rounded-md p-3">
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

          <div>
            <Label className="text-sm font-medium mb-2 block">
              Age Groups {filters.ageGroups.length > 0 && `(${filters.ageGroups.length})`}
            </Label>
            <div className="space-y-2 border rounded-md p-3">
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

          <div>
            <Label className="text-sm font-medium mb-2 block">
              Session Length {filters.sessionLengths.length > 0 && `(${filters.sessionLengths.length})`}
            </Label>
            <div className="space-y-2 border rounded-md p-3">
              {SESSION_LENGTHS.map((length) => (
                <div key={length} className="flex items-center space-x-2">
                  <Checkbox
                    id={`session-length-${length}`}
                    checked={filters.sessionLengths.includes(length)}
                    onCheckedChange={() => toggleArrayFilter("sessionLengths", length)}
                    data-testid={`checkbox-session-length-${length}`}
                  />
                  <Label htmlFor={`session-length-${length}`} className="text-sm cursor-pointer">
                    {length}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">
              Virtual Platforms {filters.virtualPlatforms.length > 0 && `(${filters.virtualPlatforms.length})`}
            </Label>
            <div className="space-y-2 border rounded-md p-3 max-h-64 overflow-y-auto">
              {VIRTUAL_PLATFORMS.map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={`platform-${platform}`}
                    checked={filters.virtualPlatforms.includes(platform)}
                    onCheckedChange={() => toggleArrayFilter("virtualPlatforms", platform)}
                    data-testid={`checkbox-platform-${platform.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <Label htmlFor={`platform-${platform}`} className="text-sm cursor-pointer">
                    {platform}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Accessibility Features */}
      <AccordionItem value="accessibility">
        <AccordionTrigger className="text-sm font-semibold">
          Accessibility {(filters.wheelchairAccessible || filters.aslCapable || filters.serviceAnimalFriendly) && `(${[filters.wheelchairAccessible, filters.aslCapable, filters.serviceAnimalFriendly].filter(Boolean).length})`}
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Controller
              name="wheelchairAccessible"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="wheelchair"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-wheelchair-accessible"
                />
              )}
            />
            <Label htmlFor="wheelchair" className="text-sm font-medium cursor-pointer">
              Wheelchair Accessible
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="aslCapable"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="asl"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-asl-capable"
                />
              )}
            />
            <Label htmlFor="asl" className="text-sm font-medium cursor-pointer">
              ASL Capable
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="serviceAnimalFriendly"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="service-animal"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-service-animal-friendly"
                />
              )}
            />
            <Label htmlFor="service-animal" className="text-sm font-medium cursor-pointer">
              Service Animal Friendly
            </Label>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Insurance & Communities */}
      <AccordionItem value="insurance">
        <AccordionTrigger className="text-sm font-semibold">
          Insurance & Communities {(filters.insurance.length > 0 || filters.communities.length > 0 || filters.consultationOffered || filters.superbillProvided || filters.fsaHsaAccepted) && `(${filters.insurance.length + filters.communities.length + [filters.consultationOffered, filters.superbillProvided, filters.fsaHsaAccepted].filter(Boolean).length})`}
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Insurance Providers {filters.insurance.length > 0 && `(${filters.insurance.length})`}
          </Label>
          <SearchableCheckboxList
            items={INSURANCE_PROVIDERS}
            selectedItems={filters.insurance}
            onToggle={(item) => toggleArrayFilter("insurance", item)}
            placeholder="Search insurance..."
            testIdPrefix="insurance"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">
            Community Focus {filters.communities.length > 0 && `(${filters.communities.length})`}
          </Label>
          <div className="space-y-2 border rounded-md p-3 max-h-64 overflow-y-auto">
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

        <div>
          <Label className="text-sm font-medium mb-3 block">Financial Options</Label>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Controller
                name="consultationOffered"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="consultation"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-consultation-offered"
                  />
                )}
              />
              <Label htmlFor="consultation" className="text-sm font-medium cursor-pointer">
                Free Consultation Offered
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="superbillProvided"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="superbill"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-superbill-provided"
                  />
                )}
              />
              <Label htmlFor="superbill" className="text-sm font-medium cursor-pointer">
                Superbill Provided
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="fsaHsaAccepted"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="fsa-hsa"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-fsa-hsa-accepted"
                  />
                )}
              />
              <Label htmlFor="fsa-hsa" className="text-sm font-medium cursor-pointer">
                FSA/HSA Accepted
              </Label>
            </div>
          </div>
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
));

FilterContent.displayName = "FilterContent";

export default function TherapistSearch() {
  const { form, filters, debouncedFilters, setValue, toggleArrayFilter, clearFilters, filterCount } = useTherapistFilters();
  const { control } = form;

  const [sortBy, setSortBy] = useState("relevance");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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
  }, []);

  const { data: therapists, isLoading } = useQuery<Therapist[]>({
    queryKey: ["/api/therapists", debouncedFilters, sortBy], // Use debounced filters for API!
    queryFn: async () => {
      const params = new URLSearchParams();

      // Use debouncedFilters for API params to prevent excessive requests
      // Send separate location fields to backend
      if (debouncedFilters.street) params.set("street", debouncedFilters.street);
      if (debouncedFilters.city) params.set("city", debouncedFilters.city);
      if (debouncedFilters.state) params.set("state", debouncedFilters.state);
      if (debouncedFilters.zipCode) params.set("zipCode", debouncedFilters.zipCode);
      // Fallback to old location field for backward compatibility
      if (debouncedFilters.location && !debouncedFilters.city && !debouncedFilters.zipCode) {
        params.set("location", debouncedFilters.location);
      }
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

      // NEW FILTERS - Phase 1: Core Matching
      if (debouncedFilters.gender.length) params.set("gender", debouncedFilters.gender.join(','));
      if (debouncedFilters.certifications.length) params.set("certifications", debouncedFilters.certifications.join(','));
      if (debouncedFilters.sessionLengths.length) params.set("sessionLengths", debouncedFilters.sessionLengths.join(','));
      if (debouncedFilters.availableImmediately) params.set("availableImmediately", "true");

      // NEW FILTERS - Phase 2: Accessibility
      if (debouncedFilters.wheelchairAccessible) params.set("wheelchairAccessible", "true");
      if (debouncedFilters.aslCapable) params.set("aslCapable", "true");
      if (debouncedFilters.serviceAnimalFriendly) params.set("serviceAnimalFriendly", "true");
      if (debouncedFilters.virtualPlatforms.length) params.set("virtualPlatforms", debouncedFilters.virtualPlatforms.join(','));

      // NEW FILTERS - Phase 3: Financial
      if (debouncedFilters.consultationOffered) params.set("consultationOffered", "true");
      if (debouncedFilters.superbillProvided) params.set("superbillProvided", "true");
      if (debouncedFilters.fsaHsaAccepted) params.set("fsaHsaAccepted", "true");

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
                  <FilterContent
                    filters={filters}
                    control={control}
                    setValue={setValue}
                    toggleArrayFilter={toggleArrayFilter}
                    clearFilters={clearFilters}
                    filterCount={filterCount}
                  />
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
                      <FilterContent
                        filters={filters}
                        control={control}
                        setValue={setValue}
                        toggleArrayFilter={toggleArrayFilter}
                        clearFilters={clearFilters}
                        filterCount={filterCount}
                      />
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

            {/* Active Filters Chips Bar */}
            {filterCount > 0 && (
              <Card className="mb-6 bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
                      {(filters.city || filters.zipCode) && (
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          <MapPin className="h-3 w-3 mr-1" />
                          {filters.city && filters.state ? `${filters.city}, ${filters.state}` : filters.zipCode}
                          <X
                            className="h-3 w-3 ml-1"
                            onClick={() => {
                              setValue('street', '');
                              setValue('city', '');
                              setValue('state', '');
                              setValue('zipCode', '');
                            }}
                          />
                        </Badge>
                      )}
                      {filters.acceptingNewClients && (
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Accepting
                          <X
                            className="h-3 w-3 ml-1"
                            onClick={() => setValue('acceptingNewClients', false)}
                          />
                        </Badge>
                      )}
                      {(filters.priceMin > 0 || filters.priceMax < 300) && (
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ${filters.priceMin}-${filters.priceMax}
                          <X
                            className="h-3 w-3 ml-1"
                            onClick={() => {
                              setValue('priceMin', 0);
                              setValue('priceMax', 300);
                            }}
                          />
                        </Badge>
                      )}
                      {filters.specialties.slice(0, 3).map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          {specialty}
                          <X
                            className="h-3 w-3 ml-1"
                            onClick={() => toggleArrayFilter('specialties', specialty)}
                          />
                        </Badge>
                      ))}
                      {filters.specialties.length > 3 && (
                        <Badge variant="secondary">
                          +{filters.specialties.length - 3} more
                        </Badge>
                      )}
                      {filters.sessionTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="cursor-pointer hover:bg-secondary/80 capitalize">
                          {type}
                          <X
                            className="h-3 w-3 ml-1"
                            onClick={() => toggleArrayFilter('sessionTypes', type)}
                          />
                        </Badge>
                      ))}
                      {filters.modalities.slice(0, 2).map((modality) => (
                        <Badge key={modality} variant="secondary" className="cursor-pointer hover:bg-secondary/80 capitalize">
                          {modality}
                          <X
                            className="h-3 w-3 ml-1"
                            onClick={() => toggleArrayFilter('modalities', modality)}
                          />
                        </Badge>
                      ))}
                      {filters.modalities.length > 2 && (
                        <Badge variant="secondary">
                          +{filters.modalities.length - 2} modalities
                        </Badge>
                      )}
                      {filters.insurance.slice(0, 2).map((insurance) => (
                        <Badge key={insurance} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          {insurance}
                          <X
                            className="h-3 w-3 ml-1"
                            onClick={() => toggleArrayFilter('insurance', insurance)}
                          />
                        </Badge>
                      ))}
                      {filters.insurance.length > 2 && (
                        <Badge variant="secondary">
                          +{filters.insurance.length - 2} providers
                        </Badge>
                      )}
                      {filters.gender.slice(0, 2).map((gender) => (
                        <Badge key={gender} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          {gender}
                          <X
                            className="h-3 w-3 ml-1"
                            onClick={() => toggleArrayFilter('gender', gender)}
                          />
                        </Badge>
                      ))}
                      {filters.gender.length > 2 && (
                        <Badge variant="secondary">
                          +{filters.gender.length - 2} more
                        </Badge>
                      )}
                      {filters.availableImmediately && (
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          Available Now
                          <X
                            className="h-3 w-3 ml-1"
                            onClick={() => setValue('availableImmediately', false)}
                          />
                        </Badge>
                      )}
                      {filters.wheelchairAccessible && (
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          Wheelchair Accessible
                          <X
                            className="h-3 w-3 ml-1"
                            onClick={() => setValue('wheelchairAccessible', false)}
                          />
                        </Badge>
                      )}
                      {filters.aslCapable && (
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          ASL
                          <X
                            className="h-3 w-3 ml-1"
                            onClick={() => setValue('aslCapable', false)}
                          />
                        </Badge>
                      )}
                      {filters.consultationOffered && (
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          Free Consultation
                          <X
                            className="h-3 w-3 ml-1"
                            onClick={() => setValue('consultationOffered', false)}
                          />
                        </Badge>
                      )}
                      {filters.fsaHsaAccepted && (
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          FSA/HSA
                          <X
                            className="h-3 w-3 ml-1"
                            onClick={() => setValue('fsaHsaAccepted', false)}
                          />
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs"
                    >
                      Clear all
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading Overlay */}
            {isLoading && (
              <div className="relative">
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg min-h-[200px]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">Finding therapists...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results Grid - Using memoized component to prevent re-renders */}
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
