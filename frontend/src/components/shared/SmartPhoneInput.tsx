import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, ChevronDown, Check } from 'lucide-react';

export interface PhoneData {
    fullNumber: string;      // Número completo con código de país
    countryCode: string;     // Código de país (+1, +52, etc.)
    number: string;          // Número sin código de país
}

interface SmartPhoneInputProps {
    value: PhoneData | string;  // Acepta objeto o string simple
    onChange: (data: PhoneData) => void;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
}

// Códigos de país ordenados por relevancia para logística
const COUNTRY_CODES = [
    { code: '+1', country: 'US/CA', flag: '🇺🇸', name: 'United States / Canada', nameEs: 'Estados Unidos / Canadá' },
    { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico', nameEs: 'México' },
    { code: '+502', country: 'GT', flag: '🇬🇹', name: 'Guatemala', nameEs: 'Guatemala' },
    { code: '+503', country: 'SV', flag: '🇸🇻', name: 'El Salvador', nameEs: 'El Salvador' },
    { code: '+504', country: 'HN', flag: '🇭🇳', name: 'Honduras', nameEs: 'Honduras' },
    { code: '+505', country: 'NI', flag: '🇳🇮', name: 'Nicaragua', nameEs: 'Nicaragua' },
    { code: '+506', country: 'CR', flag: '🇨🇷', name: 'Costa Rica', nameEs: 'Costa Rica' },
    { code: '+507', country: 'PA', flag: '🇵🇦', name: 'Panama', nameEs: 'Panamá' },
    { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia', nameEs: 'Colombia' },
    { code: '+51', country: 'PE', flag: '🇵🇪', name: 'Peru', nameEs: 'Perú' },
    { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile', nameEs: 'Chile' },
    { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina', nameEs: 'Argentina' },
    { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil', nameEs: 'Brasil' },
    { code: '+58', country: 'VE', flag: '🇻🇪', name: 'Venezuela', nameEs: 'Venezuela' },
    { code: '+593', country: 'EC', flag: '🇪🇨', name: 'Ecuador', nameEs: 'Ecuador' },
    { code: '+591', country: 'BO', flag: '🇧🇴', name: 'Bolivia', nameEs: 'Bolivia' },
    { code: '+595', country: 'PY', flag: '🇵🇾', name: 'Paraguay', nameEs: 'Paraguay' },
    { code: '+598', country: 'UY', flag: '🇺🇾', name: 'Uruguay', nameEs: 'Uruguay' },
];

/**
 * Smart Phone Input Component
 * With country code dropdown and phone number formatting
 */
export function SmartPhoneInput({
    value,
    onChange,
    label,
    required = false,
    disabled = false,
    className = '',
    placeholder,
}: SmartPhoneInputProps) {
    const { t, i18n } = useTranslation();
    const isSpanish = i18n.language === 'es';
    const inputRef = useRef<HTMLInputElement>(null);

    // Parse initial value
    const parseValue = useCallback((val: PhoneData | string): { countryCode: string; number: string } => {
        if (typeof val === 'object' && val !== null) {
            return { countryCode: val.countryCode || '+1', number: val.number || '' };
        }
        
        // Try to parse string
        const str = val || '';
        for (const cc of COUNTRY_CODES) {
            if (str.startsWith(cc.code)) {
                return { countryCode: cc.code, number: str.slice(cc.code.length).trim() };
            }
        }
        
        // Default to +1 if no code found
        return { countryCode: '+1', number: str.replace(/^\+\d+\s*/, '') };
    }, []);

    const parsed = parseValue(value);
    const [countryCode, setCountryCode] = useState(parsed.countryCode);
    const [number, setNumber] = useState(parsed.number);
    const [showDropdown, setShowDropdown] = useState(false);
    const [filter, setFilter] = useState('');

    // Sync with external value changes
    useEffect(() => {
        const newParsed = parseValue(value);
        setCountryCode(newParsed.countryCode);
        setNumber(newParsed.number);
    }, [value, parseValue]);

    // Get current country info
    const currentCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

    // Filter countries
    const filteredCountries = filter
        ? COUNTRY_CODES.filter(c => 
            c.code.includes(filter) ||
            c.country.toLowerCase().includes(filter.toLowerCase()) ||
            c.name.toLowerCase().includes(filter.toLowerCase()) ||
            c.nameEs.toLowerCase().includes(filter.toLowerCase())
        )
        : COUNTRY_CODES;

    // Format phone number for display (add dashes/spaces)
    const formatPhoneNumber = (num: string, code: string): string => {
        // Remove non-digits
        const digits = num.replace(/\D/g, '');
        
        if (code === '+1') {
            // US/Canada format: (XXX) XXX-XXXX
            if (digits.length <= 3) return digits;
            if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        } else if (code === '+52') {
            // Mexico format: XX XXXX XXXX
            if (digits.length <= 2) return digits;
            if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
            return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`;
        }
        
        // Default: just add spaces every 4 digits
        return digits.replace(/(\d{4})/g, '$1 ').trim();
    };

    // Update parent
    const updatePhone = useCallback((newCode: string, newNumber: string) => {
        const cleanNumber = newNumber.replace(/\D/g, '');
        const fullNumber = `${newCode} ${cleanNumber}`;
        
        onChange({
            fullNumber,
            countryCode: newCode,
            number: cleanNumber,
        });
    }, [onChange]);

    // Handle number input
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value, countryCode);
        setNumber(formatted);
        updatePhone(countryCode, formatted);
    };

    // Handle country code selection
    const handleCountrySelect = (code: string) => {
        setCountryCode(code);
        setShowDropdown(false);
        setFilter('');
        updatePhone(code, number);
        inputRef.current?.focus();
    };

    const inputClass = "w-full border dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500 text-sm";

    return (
        <div className={`space-y-1 ${className}`}>
            {/* Label */}
            {label && (
                <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 block">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Phone Input */}
            <div className="flex gap-2">
                {/* Country Code Selector */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => !disabled && setShowDropdown(!showDropdown)}
                        className="flex items-center gap-1 px-3 py-2 border dark:border-keikichi-forest-600 rounded-md bg-white dark:bg-keikichi-forest-700 text-sm hover:bg-gray-50 dark:hover:bg-keikichi-forest-600 transition-colors min-w-[100px]"
                        disabled={disabled}
                    >
                        <span className="text-lg">{currentCountry.flag}</span>
                        <span className="font-medium">{countryCode}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showDropdown && (
                        <div className="absolute z-50 mt-1 w-72 bg-white dark:bg-keikichi-forest-700 border dark:border-keikichi-forest-600 rounded-md shadow-lg max-h-72 overflow-auto">
                            {/* Search filter */}
                            <div className="sticky top-0 p-2 bg-white dark:bg-keikichi-forest-700 border-b dark:border-keikichi-forest-600">
                                <input
                                    type="text"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    placeholder={t('common.search')}
                                    className="w-full px-2 py-1 text-sm border dark:border-keikichi-forest-600 rounded bg-white dark:bg-keikichi-forest-800"
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                />
                            </div>
                            
                            {filteredCountries.map((country) => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleCountrySelect(country.code)}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-600 flex items-center gap-3 ${
                                        countryCode === country.code ? 'bg-keikichi-lime-50 dark:bg-keikichi-forest-600' : ''
                                    }`}
                                >
                                    <span className="text-lg">{country.flag}</span>
                                    <span className="font-medium w-14">{country.code}</span>
                                    <span className="text-gray-600 dark:text-gray-300 flex-1 truncate">
                                        {isSpanish ? country.nameEs : country.name}
                                    </span>
                                    {countryCode === country.code && (
                                        <Check className="w-4 h-4 text-keikichi-lime-600 flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                            
                            {filteredCountries.length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-500">{t('common.noResults')}</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Phone Number Input */}
                <div className="relative flex-1">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-keikichi-forest-400 dark:text-keikichi-lime-400" />
                    <input
                        ref={inputRef}
                        type="tel"
                        value={number}
                        onChange={handleNumberChange}
                        placeholder={placeholder || (countryCode === '+1' ? '(555) 123-4567' : countryCode === '+52' ? '55 1234 5678' : '1234 5678')}
                        className={`${inputClass} pl-9`}
                        disabled={disabled}
                    />
                </div>
            </div>

            {/* Click outside to close dropdown */}
            {showDropdown && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => {
                        setShowDropdown(false);
                        setFilter('');
                    }}
                />
            )}
        </div>
    );
}

export default SmartPhoneInput;
