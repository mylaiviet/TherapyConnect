import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// US States with full names
const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

interface LocationFieldsProps {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  onStreetChange?: (value: string) => void;
  onCityChange?: (value: string) => void;
  onStateChange?: (value: string) => void;
  onZipCodeChange?: (value: string) => void;
}

export function LocationFields({
  street = "",
  city = "",
  state = "",
  zipCode = "",
  onStreetChange,
  onCityChange,
  onStateChange,
  onZipCodeChange,
}: LocationFieldsProps) {

  // Validate ZIP code and auto-fill city/state
  const handleZipCodeChange = async (zip: string) => {
    onZipCodeChange?.(zip);

    if (/^\d{5}$/.test(zip)) {
      try {
        const response = await fetch(`/api/locations/search?q=${zip}&limit=1`);
        if (response.ok) {
          const results: Array<{ city: string; state: string; zip: string }> = await response.json();
          if (results.length > 0) {
            const location = results[0];
            onCityChange?.(location.city);
            onStateChange?.(location.state);
          }
        }
      } catch (error) {
        console.error("Failed to lookup ZIP code:", error);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Street Address */}
      <div>
        <Label htmlFor="street" className="text-sm font-medium mb-1.5 block">
          Street Address (Optional)
        </Label>
        <Input
          id="street"
          type="text"
          value={street}
          onChange={(e) => onStreetChange?.(e.target.value)}
          placeholder="123 Main St"
          className="w-full"
        />
      </div>

      {/* City - Simple Input with Optional Autocomplete */}
      <div>
        <Label htmlFor="city" className="text-sm font-medium mb-1.5 block">
          City
        </Label>
        <Input
          id="city"
          type="text"
          value={city}
          onChange={(e) => onCityChange?.(e.target.value)}
          placeholder="Enter city name"
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Type city name (e.g., Denver, Houston)
        </p>
      </div>

      {/* State Dropdown */}
      <div>
        <Label htmlFor="state" className="text-sm font-medium mb-1.5 block">
          State
        </Label>
        <Select value={state} onValueChange={onStateChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {US_STATES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ZIP Code */}
      <div>
        <Label htmlFor="zipCode" className="text-sm font-medium mb-1.5 block">
          ZIP Code
        </Label>
        <Input
          id="zipCode"
          type="text"
          value={zipCode}
          onChange={(e) => handleZipCodeChange(e.target.value)}
          placeholder="12345"
          maxLength={5}
          pattern="\d{5}"
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter ZIP to auto-fill city and state
        </p>
      </div>
    </div>
  );
}
