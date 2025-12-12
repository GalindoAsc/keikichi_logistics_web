import { useState, useEffect, useRef } from 'react';

const EMAIL_DOMAINS = [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'yahoo.com',
    'icloud.com',
    'live.com',
    'protonmail.com',
];

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
}

export function EmailInput({ value, onChange, placeholder = "tu@email.com", required, className }: Props) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        onChange(input);

        if (input.includes('@')) {
            const [username, domain] = input.split('@');

            // Only show suggestions if we have a username and the domain part is incomplete
            if (username && username.length > 0) {
                let matches = EMAIL_DOMAINS;

                if (domain) {
                    matches = EMAIL_DOMAINS.filter(d =>
                        d.toLowerCase().startsWith(domain.toLowerCase()) &&
                        d.toLowerCase() !== domain.toLowerCase()
                    );
                }

                setFilteredSuggestions(matches);
                setShowSuggestions(matches.length > 0);
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (domain: string) => {
        const username = value.split('@')[0];
        onChange(`${username}@${domain}`);
        setShowSuggestions(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type="email"
                value={value}
                onChange={handleChange}
                onFocus={() => {
                    if (value.includes('@')) {
                        const [_, domain] = value.split('@');
                        if (!domain || EMAIL_DOMAINS.some(d => d.startsWith(domain))) {
                            setShowSuggestions(true);
                        }
                    }
                }}
                placeholder={placeholder}
                required={required}
                className={`w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${className}`}
            />

            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    {filteredSuggestions.map(domain => {
                        const username = value.split('@')[0];
                        return (
                            <button
                                key={domain}
                                type="button"
                                onClick={() => handleSelectSuggestion(domain)}
                                className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 group transition-colors"
                            >
                                <span className="text-slate-900 dark:text-white font-medium">{username}</span>
                                <span className="text-slate-400 group-hover:text-blue-500">@{domain}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
