import { useForm, UseFormReturn } from "react-hook-form";
import { useEffect, useState, useMemo } from "react";

export interface TherapistFilters {
  // Location - separate fields
  street: string;
  city: string;
  state: string;
  zipCode: string;
  location: string; // Deprecated - kept for backward compatibility
  radius: number;
  specialties: string[];
  sessionTypes: string[];
  modalities: string[];
  ageGroups: string[];
  insurance: string[];
  communities: string[];
  priceMin: number;
  priceMax: number;
  acceptingNewClients: boolean;

  // NEW FILTERS - Phase 1: Core Matching
  gender: string[];
  certifications: string[];
  sessionLengths: string[];
  availableImmediately: boolean; // currentWaitlistWeeks = 0

  // NEW FILTERS - Phase 2: Accessibility
  wheelchairAccessible: boolean;
  aslCapable: boolean;
  serviceAnimalFriendly: boolean;
  virtualPlatforms: string[];

  // NEW FILTERS - Phase 3: Financial
  consultationOffered: boolean;
  superbillProvided: boolean;
  fsaHsaAccepted: boolean;
}

const defaultFilters: TherapistFilters = {
  street: "",
  city: "",
  state: "",
  zipCode: "",
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

  // NEW FILTERS defaults
  gender: [],
  certifications: [],
  sessionLengths: [],
  availableImmediately: false,
  wheelchairAccessible: false,
  aslCapable: false,
  serviceAnimalFriendly: false,
  virtualPlatforms: [],
  consultationOffered: false,
  superbillProvided: false,
  fsaHsaAccepted: false,
};

export function useTherapistFilters() {
  // Read URL parameters on initial load
  const getInitialFilters = (): TherapistFilters => {
    const params = new URLSearchParams(window.location.search);
    const initialFilters = { ...defaultFilters };

    // Location parameters
    // If 'location' param exists (from landing page), parse it intelligently
    if (params.has('location')) {
      const location = params.get('location')!;
      initialFilters.location = location;

      // If it's a 5-digit number, treat as ZIP code
      if (/^\d{5}$/.test(location)) {
        initialFilters.zipCode = location;
      }
      // If it's 2 letters, treat as state code
      else if (/^[A-Za-z]{2}$/.test(location)) {
        initialFilters.state = location.toUpperCase();
      }
      // Otherwise treat as city name
      else {
        initialFilters.city = location;
      }
    }

    // Explicit parameters override the 'location' parsing
    if (params.has('city')) initialFilters.city = params.get('city')!;
    if (params.has('state')) initialFilters.state = params.get('state')!;
    if (params.has('zipCode')) initialFilters.zipCode = params.get('zipCode')!;
    if (params.has('street')) initialFilters.street = params.get('street')!;
    if (params.has('radius')) initialFilters.radius = parseInt(params.get('radius')!);

    // Helper to capitalize first letter of each word for matching
    const capitalizeWords = (str: string): string => {
      return str.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    };

    // Array parameters - normalize capitalization for matching
    if (params.has('specialties')) {
      initialFilters.specialties = params.get('specialties')!.split(',').map(s => capitalizeWords(s.trim()));
    }
    if (params.has('specialty')) {
      initialFilters.specialties = [capitalizeWords(params.get('specialty')!.trim())]; // Support singular from landing page
    }
    if (params.has('sessionTypes')) initialFilters.sessionTypes = params.get('sessionTypes')!.split(',');
    if (params.has('modalities')) initialFilters.modalities = params.get('modalities')!.split(',');
    if (params.has('ageGroups')) initialFilters.ageGroups = params.get('ageGroups')!.split(',');
    if (params.has('insurance')) initialFilters.insurance = params.get('insurance')!.split(',');
    if (params.has('communities')) initialFilters.communities = params.get('communities')!.split(',');
    if (params.has('gender')) initialFilters.gender = params.get('gender')!.split(',');
    if (params.has('certifications')) initialFilters.certifications = params.get('certifications')!.split(',');
    if (params.has('sessionLengths')) initialFilters.sessionLengths = params.get('sessionLengths')!.split(',');
    if (params.has('virtualPlatforms')) initialFilters.virtualPlatforms = params.get('virtualPlatforms')!.split(',');

    // Price parameters
    if (params.has('priceMin')) initialFilters.priceMin = parseInt(params.get('priceMin')!);
    if (params.has('priceMax')) initialFilters.priceMax = parseInt(params.get('priceMax')!);

    // Boolean parameters
    if (params.has('acceptingNewClients')) initialFilters.acceptingNewClients = params.get('acceptingNewClients') === 'true';
    if (params.has('availableImmediately')) initialFilters.availableImmediately = params.get('availableImmediately') === 'true';
    if (params.has('wheelchairAccessible')) initialFilters.wheelchairAccessible = params.get('wheelchairAccessible') === 'true';
    if (params.has('aslCapable')) initialFilters.aslCapable = params.get('aslCapable') === 'true';
    if (params.has('serviceAnimalFriendly')) initialFilters.serviceAnimalFriendly = params.get('serviceAnimalFriendly') === 'true';
    if (params.has('consultationOffered')) initialFilters.consultationOffered = params.get('consultationOffered') === 'true';
    if (params.has('superbillProvided')) initialFilters.superbillProvided = params.get('superbillProvided') === 'true';
    if (params.has('fsaHsaAccepted')) initialFilters.fsaHsaAccepted = params.get('fsaHsaAccepted') === 'true';

    return initialFilters;
  };

  const form = useForm<TherapistFilters>({
    defaultValues: getInitialFilters(),
    mode: "onChange", // Validate on change for instant feedback
  });

  const { watch, setValue, reset } = form;

  // Watch all form values for changes
  const filters = watch();

  // Debounce ALL filters to prevent API spam and visual refreshes
  const [debouncedFilters, setDebouncedFilters] = useState<TherapistFilters>(filters);

  // Stringify filters for deep value comparison (not reference comparison)
  // This prevents false triggers when React Hook Form returns new object references
  const filtersString = JSON.stringify(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(JSON.parse(filtersString));
    }, 300); // 300ms debounce delay for all filter changes

    return () => clearTimeout(timer);
  }, [filtersString]); // Only trigger when actual values change, not references

  // Helper to toggle array values (for checkboxes)
  const toggleArrayFilter = (
    key: keyof Pick<TherapistFilters, "specialties" | "sessionTypes" | "modalities" | "ageGroups" | "insurance" | "communities" | "gender" | "certifications" | "sessionLengths" | "virtualPlatforms">,
    value: string
  ) => {
    const current = filters[key];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setValue(key, newValue, { shouldDirty: true, shouldTouch: true });
  };

  // Clear all filters
  const clearFilters = () => {
    reset(defaultFilters);
  };

  // Get active filter count
  const getFilterCount = (): number => {
    let count = 0;
    if (filters.location || filters.city || filters.zipCode) count++;
    if (filters.acceptingNewClients) count++;
    if (filters.priceMin > 0 || filters.priceMax < 300) count++;
    if (filters.specialties.length) count++;
    if (filters.sessionTypes.length) count++;
    if (filters.modalities.length) count++;
    if (filters.ageGroups.length) count++;
    if (filters.insurance.length) count++;
    if (filters.communities.length) count++;

    // NEW FILTERS count
    if (filters.gender.length) count++;
    if (filters.certifications.length) count++;
    if (filters.sessionLengths.length) count++;
    if (filters.availableImmediately) count++;
    if (filters.wheelchairAccessible) count++;
    if (filters.aslCapable) count++;
    if (filters.serviceAnimalFriendly) count++;
    if (filters.virtualPlatforms.length) count++;
    if (filters.consultationOffered) count++;
    if (filters.superbillProvided) count++;
    if (filters.fsaHsaAccepted) count++;

    return count;
  };

  return {
    form,
    filters, // Raw filters for UI (instant updates)
    debouncedFilters, // Debounced filters for API calls (300ms delay)
    setValue,
    toggleArrayFilter,
    clearFilters,
    filterCount: getFilterCount(),
  };
}

export type UseTherapistFiltersReturn = ReturnType<typeof useTherapistFilters>;
