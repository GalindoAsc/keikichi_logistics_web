import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, X, Loader2 } from 'lucide-react';

interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address: {
        house_number?: string;
        road?: string;
        neighbourhood?: string;
        suburb?: string;
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        county?: string;
        state?: string;
        postcode?: string;
        country?: string;
        country_code?: string;
    };
}

interface AddressComponents {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
}

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string) => void;
    onAddressSelect?: (components: AddressComponents) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    allowManualEntry?: boolean;  // Allow manual entry when no results
}

const extractAddressComponents = (result: NominatimResult): AddressComponents => {
    const addr = result.address;
    return {
        address: result.display_name,
        city: addr.city || addr.town || addr.village || addr.municipality || addr.county || '',
        state: addr.state || '',
        country: addr.country || '',
        postalCode: addr.postcode || '',
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
    };
};

// Debounce hook
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

export function GoogleAddressAutocomplete({
    value,
    onChange,
    onAddressSelect,
    placeholder,
    className = '',
    disabled = false,
    allowManualEntry = true,
}: AddressAutocompleteProps) {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [searchAttempted, setSearchAttempted] = useState(false);

    const debouncedInput = useDebounce(inputValue, 400);

    // Sync external value
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Fetch suggestions from Nominatim (OpenStreetMap - FREE)
    const fetchSuggestions = useCallback(async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            // Nominatim is completely free - just respect usage policy (1 req/sec)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `format=json&` +
                `q=${encodeURIComponent(query)}&` +
                `addressdetails=1&` +
                `limit=5&` +
                `countrycodes=us,mx`, // USA and Mexico
                {
                    headers: {
                        'Accept-Language': 'es,en',
                        'User-Agent': 'KeikichiLogistics/1.0'
                    }
                }
            );
            
            if (response.ok) {
                const data: NominatimResult[] = await response.json();
                setSuggestions(data);
                setShowDropdown(true);  // Show dropdown even when empty to show "no results" message
                setSelectedIndex(-1);
                setSearchAttempted(true);
            }
        } catch (error) {
            console.error('Error fetching address suggestions:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Trigger search on debounced input change
    useEffect(() => {
        if (debouncedInput && debouncedInput.length >= 3) {
            fetchSuggestions(debouncedInput);
        } else {
            setSuggestions([]);
            setShowDropdown(false);
            setSearchAttempted(false);
        }
    }, [debouncedInput, fetchSuggestions]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue);
    };

    // Handle suggestion selection
    const handleSelect = (result: NominatimResult) => {
        const address = result.display_name;
        setInputValue(address);
        onChange(address);
        setSuggestions([]);
        setShowDropdown(false);

        if (onAddressSelect) {
            const components = extractAddressComponents(result);
            onAddressSelect(components);
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSelect(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                setSelectedIndex(-1);
                break;
        }
    };

    // Handle clear
    const handleClear = () => {
        setInputValue('');
        onChange('');
        setSuggestions([]);
        setShowDropdown(false);
        inputRef.current?.focus();
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target as Node) &&
                !inputRef.current?.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-keikichi-forest-400 dark:text-keikichi-lime-400 z-10" />
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                placeholder={placeholder || t('stops.addressPlaceholder')}
                className={`w-full border dark:border-keikichi-forest-600 rounded-md px-3 py-2 pl-9 pr-8 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500 ${className}`}
                disabled={disabled}
                autoComplete="off"
            />
            
            {isLoading && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-keikichi-forest-400 animate-spin" />
            )}
            
            {!isLoading && inputValue && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-keikichi-forest-100 dark:hover:bg-keikichi-forest-600"
                >
                    <X className="h-4 w-4 text-keikichi-forest-400" />
                </button>
            )}

            {/* Dropdown with suggestions */}
            {showDropdown && (
                <div 
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-keikichi-forest-700 border dark:border-keikichi-forest-600 rounded-md shadow-lg max-h-60 overflow-auto"
                >
                    {suggestions.length > 0 ? (
                        <>
                            {suggestions.map((result, index) => (
                                <button
                                    key={result.place_id}
                                    type="button"
                                    onClick={() => handleSelect(result)}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-600 flex items-start gap-2 ${
                                        index === selectedIndex ? 'bg-keikichi-lime-50 dark:bg-keikichi-forest-600' : ''
                                    }`}
                                >
                                    <MapPin className="h-4 w-4 text-keikichi-lime-600 dark:text-keikichi-lime-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-keikichi-forest-700 dark:text-white line-clamp-2">
                                        {result.display_name}
                                    </span>
                                </button>
                            ))}
                            <div className="px-3 py-1.5 text-xs text-keikichi-forest-400 dark:text-keikichi-forest-300 border-t dark:border-keikichi-forest-600">
                                © OpenStreetMap contributors
                            </div>
                        </>
                    ) : searchAttempted && allowManualEntry && !isLoading ? (
                        <div className="p-3 space-y-2">
                            <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-forest-300">
                                {t('address.noResultsFound')}
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDropdown(false);
                                    // Keep the manual address
                                }}
                                className="w-full text-left px-3 py-2 text-sm bg-keikichi-lime-50 dark:bg-keikichi-forest-600 hover:bg-keikichi-lime-100 dark:hover:bg-keikichi-forest-500 rounded-md flex items-center gap-2"
                            >
                                <MapPin className="h-4 w-4 text-keikichi-lime-600 dark:text-keikichi-lime-400" />
                                <span className="text-keikichi-forest-700 dark:text-white">
                                    {t('address.useManualAddress')}: <strong>{inputValue}</strong>
                                </span>
                            </button>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

// Keep export name for compatibility
export { GoogleAddressAutocomplete as AddressAutocomplete };
export default GoogleAddressAutocomplete;
