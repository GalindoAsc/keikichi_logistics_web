import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Edit3, Search } from 'lucide-react';
import { GoogleAddressAutocomplete } from './AddressAutocomplete';

export interface AddressData {
    fullAddress: string;      // La dirección completa (de OSM o construida)
    street?: string;          // Calle y número
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
}

interface SmartAddressInputProps {
    value: AddressData;
    onChange: (data: AddressData) => void;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

/**
 * Smart Address Input Component
 * - Default: Uses OpenStreetMap autocomplete (single field)
 * - Manual mode: Shows individual fields (street, city, state, etc.)
 */
export function SmartAddressInput({
    value,
    onChange,
    label,
    required = false,
    disabled = false,
    className = '',
}: SmartAddressInputProps) {
    const { t } = useTranslation();
    const [isManualMode, setIsManualMode] = useState(false);

    // Local state for manual fields
    const [street, setStreet] = useState(value.street || '');
    const [city, setCity] = useState(value.city || '');
    const [state, setState] = useState(value.state || '');
    const [country, setCountry] = useState(value.country || '');
    const [postalCode, setPostalCode] = useState(value.postalCode || '');

    // Sync when value changes externally
    useEffect(() => {
        setStreet(value.street || '');
        setCity(value.city || '');
        setState(value.state || '');
        setCountry(value.country || '');
        setPostalCode(value.postalCode || '');
    }, [value]);

    // Build full address from manual fields
    const buildFullAddress = () => {
        const parts = [street, city, state, postalCode, country].filter(Boolean);
        return parts.join(', ');
    };

    // Update parent when manual fields change
    const updateManualAddress = (field: string, newValue: string) => {
        const updates: Partial<AddressData> = { [field]: newValue };
        
        // Update local state
        switch (field) {
            case 'street': setStreet(newValue); break;
            case 'city': setCity(newValue); break;
            case 'state': setState(newValue); break;
            case 'country': setCountry(newValue); break;
            case 'postalCode': setPostalCode(newValue); break;
        }

        // Build new full address
        const newStreet = field === 'street' ? newValue : street;
        const newCity = field === 'city' ? newValue : city;
        const newState = field === 'state' ? newValue : state;
        const newCountry = field === 'country' ? newValue : country;
        const newPostal = field === 'postalCode' ? newValue : postalCode;
        
        const parts = [newStreet, newCity, newState, newPostal, newCountry].filter(Boolean);
        const fullAddress = parts.join(', ');

        onChange({
            ...value,
            ...updates,
            fullAddress,
        });
    };

    // Handle OSM selection
    const handleOSMSelect = (components: {
        address: string;
        city: string;
        state: string;
        country: string;
        postalCode?: string;
        lat?: number;
        lng?: number;
    }) => {
        // Update all fields from OSM result
        setStreet(''); // OSM doesn't give just street separately in display_name
        setCity(components.city);
        setState(components.state);
        setCountry(components.country);
        setPostalCode(components.postalCode || '');

        onChange({
            fullAddress: components.address,
            street: '', // Full address includes it
            city: components.city,
            state: components.state,
            country: components.country,
            postalCode: components.postalCode,
            lat: components.lat,
            lng: components.lng,
        });
    };

    // Toggle between modes
    const toggleMode = () => {
        if (!isManualMode) {
            // Switching TO manual: populate fields from fullAddress if we have components
            // Keep existing component values
        } else {
            // Switching TO OSM: build fullAddress from fields
            const fullAddress = buildFullAddress();
            onChange({
                ...value,
                fullAddress,
            });
        }
        setIsManualMode(!isManualMode);
    };

    const inputClass = "w-full border dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500 text-sm";

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Header with label and toggle */}
            <div className="flex items-center justify-between">
                {label && (
                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <button
                    type="button"
                    onClick={toggleMode}
                    disabled={disabled}
                    className="flex items-center gap-1.5 text-xs font-medium text-keikichi-lime-600 dark:text-keikichi-lime-400 hover:text-keikichi-lime-700 dark:hover:text-keikichi-lime-300 transition-colors disabled:opacity-50"
                >
                    {isManualMode ? (
                        <>
                            <Search className="w-3.5 h-3.5" />
                            {t('address.useSearch')}
                        </>
                    ) : (
                        <>
                            <Edit3 className="w-3.5 h-3.5" />
                            {t('address.enterManually')}
                        </>
                    )}
                </button>
            </div>

            {/* OSM Mode - Single field */}
            {!isManualMode ? (
                <GoogleAddressAutocomplete
                    value={value.fullAddress}
                    onChange={(address) => onChange({ ...value, fullAddress: address })}
                    onAddressSelect={handleOSMSelect}
                    placeholder={t('address.searchPlaceholder')}
                    disabled={disabled}
                    allowManualEntry={true}
                />
            ) : (
                /* Manual Mode - Individual fields */
                <div className="space-y-3 p-3 bg-keikichi-forest-50/50 dark:bg-keikichi-forest-800/50 rounded-lg border border-keikichi-lime-100 dark:border-keikichi-forest-600">
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
                                onChange={(e) => updateManualAddress('street', e.target.value)}
                                placeholder={t('address.streetPlaceholder')}
                                className={`${inputClass} pl-9`}
                                disabled={disabled}
                            />
                        </div>
                    </div>

                    {/* City & State */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 block">
                                {t('address.city')}
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => updateManualAddress('city', e.target.value)}
                                placeholder={t('address.cityPlaceholder')}
                                className={inputClass}
                                disabled={disabled}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 block">
                                {t('address.state')}
                            </label>
                            <input
                                type="text"
                                value={state}
                                onChange={(e) => updateManualAddress('state', e.target.value)}
                                placeholder={t('address.statePlaceholder')}
                                className={inputClass}
                                disabled={disabled}
                            />
                        </div>
                    </div>

                    {/* Postal Code & Country */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 block">
                                {t('address.postalCode')}
                            </label>
                            <input
                                type="text"
                                value={postalCode}
                                onChange={(e) => updateManualAddress('postalCode', e.target.value)}
                                placeholder={t('address.postalCodePlaceholder')}
                                className={inputClass}
                                disabled={disabled}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 block">
                                {t('address.country')}
                            </label>
                            <input
                                type="text"
                                value={country}
                                onChange={(e) => updateManualAddress('country', e.target.value)}
                                placeholder={t('address.countryPlaceholder')}
                                className={inputClass}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SmartAddressInput;
