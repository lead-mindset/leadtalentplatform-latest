export interface LocationData {
  address: string;
  venueName?: string;
  city?: string;
  region?: string;
  lat: number;
  lng: number;
}

export interface LocationAutocompleteProps {
  value?: string;
  onChange: (locationData: LocationData) => void;
  onClear: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}
