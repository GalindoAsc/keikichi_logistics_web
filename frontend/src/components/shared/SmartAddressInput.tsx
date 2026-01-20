import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Loader2, Check, ChevronDown } from 'lucide-react';

export interface AddressData {
    fullAddress: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}

interface SmartAddressInputProps {
    value: AddressData;
    onChange: (data: AddressData) => void;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

// Lista de países principales para logística
const COUNTRIES = [
    { code: 'US', name: 'United States', nameEs: 'Estados Unidos' },
    { code: 'MX', name: 'Mexico', nameEs: 'México' },
    { code: 'CA', name: 'Canada', nameEs: 'Canadá' },
    { code: 'GT', name: 'Guatemala', nameEs: 'Guatemala' },
    { code: 'HN', name: 'Honduras', nameEs: 'Honduras' },
    { code: 'SV', name: 'El Salvador', nameEs: 'El Salvador' },
    { code: 'NI', name: 'Nicaragua', nameEs: 'Nicaragua' },
    { code: 'CR', name: 'Costa Rica', nameEs: 'Costa Rica' },
    { code: 'PA', name: 'Panama', nameEs: 'Panamá' },
    { code: 'CO', name: 'Colombia', nameEs: 'Colombia' },
    { code: 'PE', name: 'Peru', nameEs: 'Perú' },
    { code: 'CL', name: 'Chile', nameEs: 'Chile' },
    { code: 'AR', name: 'Argentina', nameEs: 'Argentina' },
    { code: 'BR', name: 'Brazil', nameEs: 'Brasil' },
];

// Estados de USA
const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
];

// Estados de México
const MX_STATES = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
    'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México',
    'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit',
    'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
    'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

// Provincias de Canadá
const CA_PROVINCES = [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
    'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
    'Quebec', 'Saskatchewan', 'Yukon'
];

/**
 * Smart Address Input Component
 * Manual entry with postal code lookup and country/state dropdowns
 */
export function SmartAddressInput({
    value,
    onChange,
    label,
    required = false,
    disabled = false,
    className = '',
}: SmartAddressInputProps) {
    const { t, i18n } = useTranslation();
    const isSpanish = i18n.language === 'es';

    // Local state
    const [street, setStreet] = useState(value.street || '');
    const [city, setCity] = useState(value.city || '');
    const [state, setState] = useState(value.state || '');
    const [countryCode, setCountryCode] = useState(() => {
        // Try to match the country value to a code
        const match = COUNTRIES.find(c => 
            c.name === value.country || 
            c.nameEs === value.country || 
            c.code === value.country
        );
        return match?.code || 'US';
    });
    const [postalCode, setPostalCode] = useState(value.postalCode || '');
    
    // Postal code lookup state
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [lookupSuccess, setLookupSuccess] = useState(false);
    
    // Dropdown states
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showStateDropdown, setShowStateDropdown] = useState(false);
    const [stateFilter, setStateFilter] = useState('');

    // Get states for current country
    const getStatesForCountry = useCallback((code: string): string[] => {
        switch (code) {
            case 'US': return US_STATES;
            case 'MX': return MX_STATES;
            case 'CA': return CA_PROVINCES;
            default: return [];
        }
    }, []);

    const currentStates = getStatesForCountry(countryCode);
    const filteredStates = stateFilter 
        ? currentStates.filter(s => s.toLowerCase().includes(stateFilter.toLowerCase()))
        : currentStates;

    // Get country display name
    const getCountryName = useCallback((code: string) => {
        const country = COUNTRIES.find(c => c.code === code);
        return isSpanish ? country?.nameEs : country?.name;
    }, [isSpanish]);

    // Sync when value changes externally
    useEffect(() => {
        setStreet(value.street || '');
        setCity(value.city || '');
        setState(value.state || '');
        setPostalCode(value.postalCode || '');
        
        const match = COUNTRIES.find(c => 
            c.name === value.country || 
            c.nameEs === value.country || 
            c.code === value.country
        );
        if (match) setCountryCode(match.code);
    }, [value]);

    // Build full address
    const buildFullAddress = useCallback((
        newStreet: string,
        newCity: string,
        newState: string,
        newPostal: string,
        newCountryCode: string
    ) => {
        const countryName = getCountryName(newCountryCode) || '';
        const parts = [newStreet, newCity, newState, newPostal, countryName].filter(Boolean);
        return parts.join(', ');
    }, [getCountryName]);

    // Update parent
    const updateAddress = useCallback((updates: Partial<{
        street: string;
        city: string;
        state: string;
        postalCode: string;
        countryCode: string;
    }>) => {
        const newStreet = updates.street ?? street;
        const newCity = updates.city ?? city;
        const newState = updates.state ?? state;
        const newPostal = updates.postalCode ?? postalCode;
        const newCountryCode = updates.countryCode ?? countryCode;

        const fullAddress = buildFullAddress(newStreet, newCity, newState, newPostal, newCountryCode);
        const countryName = getCountryName(newCountryCode) || '';

        onChange({
            fullAddress,
            street: newStreet,
            city: newCity,
            state: newState,
            postalCode: newPostal,
            country: countryName,
        });
    }, [street, city, state, postalCode, countryCode, buildFullAddress, getCountryName, onChange]);

    // Postal code lookup using Zippopotam API (free, no API key needed)
    const lookupPostalCode = useCallback(async (code: string, country: string) => {
        if (!code || code.length < 3) return;
        
        // Only lookup for supported countries
        const supportedCountries = ['US', 'MX', 'CA'];
        if (!supportedCountries.includes(country)) return;

        setIsLookingUp(true);
        setLookupSuccess(false);

        try {
            const response = await fetch(`https://api.zippopotam.us/${country.toLowerCase()}/${code}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.places && data.places.length > 0) {
                    const place = data.places[0];
                    const newCity = place['place name'] || '';
                    const newState = place['state'] || place['state abbreviation'] || '';
                    
                    setCity(newCity);
                    setState(newState);
                    setLookupSuccess(true);
                    
                    updateAddress({
                        city: newCity,
                        state: newState,
                        postalCode: code,
                    });
                    
                    // Clear success indicator after 2 seconds
                    setTimeout(() => setLookupSuccess(false), 2000);
                }
            }
        } catch {
            // Silently fail - user can still enter manually
        } finally {
            setIsLookingUp(false);
        }
    }, [updateAddress]);

    // Handle postal code change with debounced lookup
    useEffect(() => {
        const timer = setTimeout(() => {
            if (postalCode.length >= 5) {
                lookupPostalCode(postalCode, countryCode);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [postalCode, countryCode, lookupPostalCode]);

    const inputClass = "w-full border dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500 text-sm";

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Label */}
            {label && (
                <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 block">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Address Fields */}
            <div className="space-y-3 p-3 bg-keikichi-forest-50/50 dark:bg-keikichi-forest-800/50 rounded-lg border border-keikichi-lime-100 dark:border-keikichi-forest-600">
                
                {/* Country */}
                <div className="relative">
                    <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 block">
                        {t('address.country')}
                    </label>
                    <button
                        type="button"
                        onClick={() => !disabled && setShowCountryDropdown(!showCountryDropdown)}
                        className={`${inputClass} flex items-center justify-between text-left`}
                        disabled={disabled}
                    >
                        <span>{getCountryName(countryCode)}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showCountryDropdown && (
                        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-keikichi-forest-700 border dark:border-keikichi-forest-600 rounded-md shadow-lg max-h-60 overflow-auto">
                            {COUNTRIES.map((country) => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => {
                                        setCountryCode(country.code);
                                        setState(''); // Reset state when country changes
                                        setShowCountryDropdown(false);
                                        updateAddress({ countryCode: country.code, state: '' });
                                    }}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-600 flex items-center justify-between ${
                                        countryCode === country.code ? 'bg-keikichi-lime-50 dark:bg-keikichi-forest-600' : ''
                                    }`}
                                >
                                    <span>{isSpanish ? country.nameEs : country.name}</span>
                                    {countryCode === country.code && <Check className="w-4 h-4 text-keikichi-lime-600" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Street */}
                <div>
                    <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 block">
                        {t('address.street')}
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-keikichi-forest-400 dark:text-keikichi-lime-400" />
                        <input
                            type="text"
                            value={street}
                            onChange={(e) => {
                                setStreet(e.target.value);
                                updateAddress({ street: e.target.value });
                            }}
                            placeholder={t('address.streetPlaceholder')}
                            className={`${inputClass} pl-9`}
                            disabled={disabled}
                        />
                    </div>
                </div>

                {/* Postal Code with auto-lookup indicator */}
                <div>
                    <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 flex items-center gap-2">
                        {t('address.postalCode')}
                        {isLookingUp && (
                            <span className="flex items-center gap-1 text-keikichi-lime-600">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-[10px]">{t('address.lookingUp')}</span>
                            </span>
                        )}
                        {lookupSuccess && (
                            <span className="flex items-center gap-1 text-green-600">
                                <Check className="w-3 h-3" />
                                <span className="text-[10px]">{t('address.found')}</span>
                            </span>
                        )}
                    </label>
                    <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setPostalCode(val);
                            updateAddress({ postalCode: val });
                        }}
                        placeholder={countryCode === 'US' ? 'e.g. 90210' : countryCode === 'MX' ? 'e.g. 06600' : 'e.g. K1A 0B1'}
                        className={inputClass}
                        disabled={disabled}
                    />
                    <p className="text-[10px] text-keikichi-forest-400 dark:text-keikichi-lime-500 mt-1">
                        {t('address.postalCodeHint')}
                    </p>
                </div>

                {/* City */}
                <div>
                    <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 block">
                        {t('address.city')}
                    </label>
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => {
                            setCity(e.target.value);
                            updateAddress({ city: e.target.value });
                        }}
                        placeholder={t('address.cityPlaceholder')}
                        className={inputClass}
                        disabled={disabled}
                    />
                </div>

                {/* State/Province - Dropdown for US/MX/CA, text input for others */}
                <div className="relative">
                    <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 block">
                        {countryCode === 'MX' ? t('address.state') : 
                         countryCode === 'CA' ? t('address.province') : 
                         t('address.state')}
                    </label>
                    
                    {currentStates.length > 0 ? (
                        <>
                            <button
                                type="button"
                                onClick={() => !disabled && setShowStateDropdown(!showStateDropdown)}
                                className={`${inputClass} flex items-center justify-between text-left`}
                                disabled={disabled}
                            >
                                <span className={state ? '' : 'text-gray-400'}>{state || t('address.selectState')}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {showStateDropdown && (
                                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-keikichi-forest-700 border dark:border-keikichi-forest-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                    {/* Search filter */}
                                    <div className="sticky top-0 p-2 bg-white dark:bg-keikichi-forest-700 border-b dark:border-keikichi-forest-600">
                                        <input
                                            type="text"
                                            value={stateFilter}
                                            onChange={(e) => setStateFilter(e.target.value)}
                                            placeholder={t('common.search')}
                                            className="w-full px-2 py-1 text-sm border dark:border-keikichi-forest-600 rounded bg-white dark:bg-keikichi-forest-800"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    {filteredStates.map((stateName) => (
                                        <button
                                            key={stateName}
                                            type="button"
                                            onClick={() => {
                                                setState(stateName);
                                                setShowStateDropdown(false);
                                                setStateFilter('');
                                                updateAddress({ state: stateName });
                                            }}
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-600 flex items-center justify-between ${
                                                state === stateName ? 'bg-keikichi-lime-50 dark:bg-keikichi-forest-600' : ''
                                            }`}
                                        >
                                            <span>{stateName}</span>
                                            {state === stateName && <Check className="w-4 h-4 text-keikichi-lime-600" />}
                                        </button>
                                    ))}
                                    {filteredStates.length === 0 && (
                                        <div className="px-3 py-2 text-sm text-gray-500">{t('common.noResults')}</div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <input
                            type="text"
                            value={state}
                            onChange={(e) => {
                                setState(e.target.value);
                                updateAddress({ state: e.target.value });
                            }}
                            placeholder={t('address.statePlaceholder')}
                            className={inputClass}
                            disabled={disabled}
                        />
                    )}
                </div>
            </div>

            {/* Click outside to close dropdowns */}
            {(showCountryDropdown || showStateDropdown) && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => {
                        setShowCountryDropdown(false);
                        setShowStateDropdown(false);
                        setStateFilter('');
                    }}
                />
            )}
        </div>
    );
}

export default SmartAddressInput;
