import { useState, useEffect } from 'react';

/**
 * Hook that returns a debounced value.
 * Useful for search inputs to avoid excessive API calls.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default 300ms)
 * @returns The debounced value
 * 
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 * 
 * useEffect(() => {
 *   // This only runs 300ms after user stops typing
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook for handling search with debounce built-in.
 * Returns both the immediate value (for input) and debounced value (for queries).
 * 
 * @param initialValue - Initial search value
 * @param delay - Debounce delay in milliseconds
 * @returns [value, debouncedValue, setValue]
 * 
 * @example
 * const [search, debouncedSearch, setSearch] = useDebouncedSearch('', 300);
 * 
 * <input value={search} onChange={e => setSearch(e.target.value)} />
 * 
 * useQuery({
 *   queryKey: ['search', debouncedSearch],
 *   queryFn: () => searchApi(debouncedSearch),
 * });
 */
export function useDebouncedSearch(
    initialValue: string = '',
    delay: number = 300
): [string, string, React.Dispatch<React.SetStateAction<string>>] {
    const [value, setValue] = useState(initialValue);
    const debouncedValue = useDebounce(value, delay);

    return [value, debouncedValue, setValue];
}

export default useDebounce;
