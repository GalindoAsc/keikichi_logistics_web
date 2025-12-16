import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Country {
    code: string;
    name: string;
    flag: string;
}

const COUNTRIES: Country[] = [
    { code: '+52', name: 'México', flag: '🇲🇽' },
    { code: '+1', name: 'USA/Canada', flag: '🇺🇸' },
    { code: '+34', name: 'España', flag: '🇪🇸' },
    { code: '+54', name: 'Argentina', flag: '🇦🇷' },
    { code: '+55', name: 'Brasil', flag: '🇧🇷' },
    { code: '+57', name: 'Colombia', flag: '🇨🇴' },
    { code: '+56', name: 'Chile', flag: '🇨🇱' },
    { code: '+51', name: 'Perú', flag: '🇵🇪' },
    { code: '+502', name: 'Guatemala', flag: '🇬🇹' },
    { code: '+503', name: 'El Salvador', flag: '🇸🇻' },
    { code: '+504', name: 'Honduras', flag: '🇭🇳' },
    { code: '+505', name: 'Nicaragua', flag: '🇳🇮' },
    { code: '+506', name: 'Costa Rica', flag: '🇨🇷' },
    { code: '+507', name: 'Panamá', flag: '🇵🇦' },
];

interface Props {
    value: string;
    onChange: (value: string) => void;
}

export function CountryCodeSelector({ value, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search)
    );

    const selected = COUNTRIES.find(c => c.code === value) || COUNTRIES[0];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-2.5 border border-keikichi-lime-200 dark:border-keikichi-forest-500 rounded-lg bg-white dark:bg-keikichi-forest-700 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-600 transition-colors focus:ring-2 focus:ring-keikichi-lime-500 focus:border-keikichi-lime-500 outline-none"
            >
                <span className="text-xl leading-none">{selected.flag}</span>
                <span className="font-medium text-keikichi-forest-700 dark:text-white">{value}</span>
                <ChevronDown className={`w-4 h-4 text-keikichi-forest-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute z-20 mt-1 w-72 bg-white dark:bg-keikichi-forest-800 border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-2 border-b border-keikichi-lime-100 dark:border-keikichi-forest-600 sticky top-0 bg-white dark:bg-keikichi-forest-800">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-keikichi-forest-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar país..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md focus:outline-none focus:border-keikichi-lime-500 focus:ring-1 focus:ring-keikichi-lime-500 bg-white dark:bg-keikichi-forest-900 text-keikichi-forest-800 dark:text-white"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                            {filtered.map(country => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => {
                                        onChange(country.code);
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                    className={`w-full px-4 py-2.5 text-left hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 flex items-center gap-3 transition-colors ${country.code === value
                                        ? 'bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20 text-keikichi-lime-700 dark:text-keikichi-lime-300'
                                        : 'text-keikichi-forest-700 dark:text-keikichi-gray-200'
                                        }`}
                                >
                                    <span className="text-2xl leading-none">{country.flag}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate text-keikichi-forest-800 dark:text-white">{country.name}</div>
                                        <div className="text-xs text-keikichi-forest-500 dark:text-keikichi-forest-400">{country.code}</div>
                                    </div>
                                    {country.code === value && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-keikichi-lime-500" />
                                    )}
                                </button>
                            ))}
                            {filtered.length === 0 && (
                                <div className="px-4 py-8 text-center text-sm text-keikichi-forest-500 dark:text-keikichi-forest-400">
                                    No se encontraron resultados
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

