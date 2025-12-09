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
                className="flex items-center gap-2 px-3 py-2.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
                <span className="text-xl leading-none">{selected.flag}</span>
                <span className="font-medium text-slate-700">{value}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute z-20 mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar país..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                                    className={`w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors ${country.code === value ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                                        }`}
                                >
                                    <span className="text-2xl leading-none">{country.flag}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{country.name}</div>
                                        <div className="text-xs text-slate-500">{country.code}</div>
                                    </div>
                                    {country.code === value && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                    )}
                                </button>
                            ))}
                            {filtered.length === 0 && (
                                <div className="px-4 py-8 text-center text-sm text-slate-500">
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
