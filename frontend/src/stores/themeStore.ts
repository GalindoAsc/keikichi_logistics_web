import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light' | 'system';

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'system',
            setTheme: (theme: Theme) => {
                const root = window.document.documentElement;
                root.classList.remove('light', 'dark');

                if (theme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                        ? 'dark'
                        : 'light';
                    root.classList.add(systemTheme);
                } else {
                    root.classList.add(theme);
                }

                set({ theme });
            },
        }),
        {
            name: 'theme-storage',
            onRehydrateStorage: () => (state) => {
                // Apply theme on load
                if (state) {
                    const root = window.document.documentElement;
                    root.classList.remove('light', 'dark');

                    if (state.theme === 'system') {
                        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                            ? 'dark'
                            : 'light';
                        root.classList.add(systemTheme);
                    } else {
                        root.classList.add(state.theme);
                    }
                }
            }
        }
    )
);
