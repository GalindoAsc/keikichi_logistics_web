import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Check } from 'lucide-react';

interface SmartEmailInputProps {
    value: string;
    onChange: (email: string) => void;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    error?: string;
}

// Dominios de correo comunes ordenados por popularidad
const EMAIL_DOMAINS = [
    // Personal - Más comunes
    'gmail.com',
    'hotmail.com',
    'outlook.com',
    'yahoo.com',
    'icloud.com',
    'live.com',
    'me.com',
    'mail.com',
    'protonmail.com',
    'aol.com',
    
    // Regionales - México
    'hotmail.com.mx',
    'outlook.com.mx',
    'yahoo.com.mx',
    'prodigy.net.mx',
    'infinitum.com.mx',
    
    // Regionales - Otros
    'gmail.es',
    'hotmail.es',
    'yahoo.es',
    'outlook.es',
    
    // Empresariales comunes
    'empresa.com',
    'company.com',
];

/**
 * Smart Email Input Component
 * With domain autocomplete suggestions
 */
export function SmartEmailInput({
    value,
    onChange,
    label,
    required = false,
    disabled = false,
    className = '',
    placeholder,
    error,
}: SmartEmailInputProps) {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const [localValue, setLocalValue] = useState(value || '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Sync with external value
    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    // Get suggestions based on current input
    const getSuggestions = useCallback((): string[] => {
        if (!localValue.includes('@')) return [];
        
        const [localPart, domainPart] = localValue.split('@');
        if (!localPart) return [];
        
        // Filter domains that start with what user typed after @
        const matchingDomains = domainPart
            ? EMAIL_DOMAINS.filter(d => d.toLowerCase().startsWith(domainPart.toLowerCase()))
            : EMAIL_DOMAINS.slice(0, 8); // Show top 8 if just typed @
        
        return matchingDomains.map(d => `${localPart}@${d}`);
    }, [localValue]);

    const suggestions = getSuggestions();
    const shouldShowSuggestions = showSuggestions && suggestions.length > 0 && localValue.includes('@');

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.toLowerCase().trim();
        setLocalValue(newValue);
        setSelectedIndex(-1);
        
        // Show suggestions if @ is typed
        if (newValue.includes('@')) {
            setShowSuggestions(true);
        }
        
        onChange(newValue);
    };

    // Handle suggestion selection
    const handleSelectSuggestion = (suggestion: string) => {
        setLocalValue(suggestion);
        onChange(suggestion);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!shouldShowSuggestions) return;
        
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
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    handleSelectSuggestion(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;
            case 'Tab':
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    e.preventDefault();
                    handleSelectSuggestion(suggestions[selectedIndex]);
                } else if (suggestions.length > 0) {
                    e.preventDefault();
                    handleSelectSuggestion(suggestions[0]);
                }
                break;
        }
    };

    // Scroll selected item into view
    useEffect(() => {
        if (selectedIndex >= 0 && dropdownRef.current) {
            const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    // Validate email format
    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const hasError = error || (localValue && !localValue.includes('@'));
    const isComplete = localValue && isValidEmail(localValue);

    const inputClass = `w-full border rounded-md px-3 py-2 pl-9 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500 text-sm transition-colors ${
        hasError 
            ? 'border-red-400 dark:border-red-500' 
            : isComplete 
                ? 'border-green-400 dark:border-green-500'
                : 'dark:border-keikichi-forest-600'
    }`;

    return (
        <div className={`space-y-1 ${className}`}>
            {/* Label */}
            {label && (
                <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 block">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Email Input */}
            <div className="relative">
                <Mail className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 ${
                    isComplete ? 'text-green-500' : 'text-keikichi-forest-400 dark:text-keikichi-lime-400'
                }`} />
                
                <input
                    ref={inputRef}
                    type="email"
                    value={localValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => localValue.includes('@') && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder={placeholder || 'correo@ejemplo.com'}
                    className={inputClass}
                    disabled={disabled}
                    autoComplete="off"
                />

                {isComplete && (
                    <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}

                {/* Suggestions Dropdown */}
                {shouldShowSuggestions && (
                    <div 
                        ref={dropdownRef}
                        className="absolute z-50 mt-1 w-full bg-white dark:bg-keikichi-forest-700 border dark:border-keikichi-forest-600 rounded-md shadow-lg max-h-60 overflow-auto"
                    >
                        {suggestions.map((suggestion, index) => {
                            const [, domain] = suggestion.split('@');
                            return (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(suggestion)}
                                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${
                                        index === selectedIndex
                                            ? 'bg-keikichi-lime-100 dark:bg-keikichi-forest-600'
                                            : 'hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-600'
                                    }`}
                                >
                                    <span>
                                        <span className="text-keikichi-forest-800 dark:text-white">{suggestion.split('@')[0]}@</span>
                                        <span className="font-medium text-keikichi-lime-700 dark:text-keikichi-lime-400">{domain}</span>
                                    </span>
                                    {index === selectedIndex && (
                                        <Check className="w-4 h-4 text-keikichi-lime-600 flex-shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Hint text */}
            {localValue && localValue.includes('@') && !isValidEmail(localValue) && (
                <p className="text-[10px] text-keikichi-forest-400 dark:text-keikichi-lime-500">
                    {t('email.typeToComplete')}
                </p>
            )}

            {/* Error message */}
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}

export default SmartEmailInput;
