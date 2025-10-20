import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { MapPin } from "lucide-react";

interface LocationResult {
  zip: string;
  city: string;
  state: string;
  latitude: string | null;
  longitude: string | null;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  testId?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Street address, city, state, or ZIP",
  className,
  testId,
}: LocationAutocompleteProps) {
  const [localValue, setLocalValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync with parent when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue.length >= 2) {
        setSearchQuery(localValue);
        setShowSuggestions(true);
      } else {
        setSearchQuery("");
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue]);

  // Fetch location suggestions
  const { data: suggestions = [] } = useQuery<LocationResult[]>({
    queryKey: ["/api/locations/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const response = await fetch(`/api/locations/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
      if (!response.ok) throw new Error("Failed to fetch locations");
      return response.json();
    },
    enabled: searchQuery.length >= 2,
    staleTime: 60000, // Cache for 1 minute
  });

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
  };

  const handleSelectLocation = (location: LocationResult) => {
    const displayValue = `${location.city}, ${location.state} ${location.zip}`;
    setLocalValue(displayValue);
    onChange(displayValue);
    setShowSuggestions(false);
  };

  const handleInputBlur = () => {
    // Only update parent if user typed something
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => {
            if (localValue.length >= 2) setShowSuggestions(true);
          }}
          placeholder={placeholder}
          className={`pl-10 ${className}`}
          data-testid={testId}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
          <Command>
            <CommandList>
              <CommandGroup>
                {suggestions.map((location) => (
                  <CommandItem
                    key={`${location.city}-${location.state}-${location.zip}`}
                    onSelect={() => handleSelectLocation(location)}
                    className="cursor-pointer"
                  >
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {location.city}, {location.state}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ZIP: {location.zip}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}

      {showSuggestions && searchQuery && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md p-3">
          <p className="text-sm text-muted-foreground text-center">
            No locations found for "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
}
