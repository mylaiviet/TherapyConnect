import { useForm, UseFormReturn } from "react-hook-form";
import { useEffect, useState, useMemo } from "react";

export interface TherapistFilters {
  location: string;
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
}

const defaultFilters: TherapistFilters = {
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
};

export function useTherapistFilters() {
  const form = useForm<TherapistFilters>({
    defaultValues: defaultFilters,
    mode: "onChange", // Validate on change for instant feedback
  });

  const { watch, setValue, reset } = form;

  // Watch all form values for changes
  const filters = watch();

  // Debounce location input to prevent API spam on every keystroke
  const [debouncedLocation, setDebouncedLocation] = useState(filters.location);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(filters.location);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [filters.location]);

  // Create debounced filters object for API calls
  // FIXED: Memoize to prevent object recreation on every render
  // This prevents React Query from refetching and causing input focus loss
  const debouncedFilters: TherapistFilters = useMemo(() => ({
    ...filters,
    location: debouncedLocation,
  }), [
    debouncedLocation,
    filters.radius,
    filters.specialties,
    filters.sessionTypes,
    filters.modalities,
    filters.ageGroups,
    filters.insurance,
    filters.communities,
    filters.priceMin,
    filters.priceMax,
    filters.acceptingNewClients,
  ]);

  // Helper to toggle array values (for checkboxes)
  const toggleArrayFilter = (
    key: keyof Pick<TherapistFilters, "specialties" | "sessionTypes" | "modalities" | "ageGroups" | "insurance" | "communities">,
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
    if (filters.location) count++;
    if (filters.acceptingNewClients) count++;
    if (filters.priceMin > 0 || filters.priceMax < 300) count++;
    if (filters.specialties.length) count++;
    if (filters.sessionTypes.length) count++;
    if (filters.modalities.length) count++;
    if (filters.ageGroups.length) count++;
    if (filters.insurance.length) count++;
    if (filters.communities.length) count++;
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
