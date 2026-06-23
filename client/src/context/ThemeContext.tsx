import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	ReactNode,
} from 'react';

import type { ThemePreference } from '../api/types.js';

type ResolvedTheme = 'dark' | 'light';

interface ThemeContextValue {
	theme: ResolvedTheme;
	themePreference: ThemePreference;
	toggleTheme: () => void;
	setThemePreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
	theme: 'light',
	themePreference: 'system',
	toggleTheme: () => {},
	setThemePreference: () => {},
});

function resolveTheme(pref: ThemePreference): ResolvedTheme {
	if (pref === 'light' || pref === 'dark') return pref;
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initPreference(): ThemePreference {
	const stored = localStorage.getItem('themePreference') as ThemePreference | null;
	if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;

	// Migrate legacy 'theme' key
	const legacy = localStorage.getItem('theme');
	if (legacy === 'dark' || legacy === 'light') {
		localStorage.setItem('themePreference', legacy);
		localStorage.removeItem('theme');
		return legacy as ThemePreference;
	}

	return 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [themePreference, setThemePreferenceState] = useState<ThemePreference>(initPreference);
	const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(initPreference()));

	// Apply resolved theme to DOM and keep `theme` state in sync
	useEffect(() => {
		const resolved = resolveTheme(themePreference);
		setTheme(resolved);
		document.documentElement.classList.toggle('dark', resolved === 'dark');
	}, [themePreference]);

	// Track OS preference changes when set to 'system'
	useEffect(() => {
		if (themePreference !== 'system') return;

		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		function handleChange() {
			const resolved = mq.matches ? 'dark' : 'light';
			setTheme(resolved);
			document.documentElement.classList.toggle('dark', resolved === 'dark');
		}

		mq.addEventListener('change', handleChange);
		return () => mq.removeEventListener('change', handleChange);
	}, [themePreference]);

	// Listen for server sync after auth load
	useEffect(() => {
		function handleServerSync(e: Event) {
			const detail = (e as CustomEvent<{ themePreference: ThemePreference | null }>).detail;
			const serverPref = detail.themePreference ?? 'system';
			const localPref = localStorage.getItem('themePreference') as ThemePreference | null;
			if (serverPref !== localPref) {
				localStorage.setItem('themePreference', serverPref);
				setThemePreferenceState(serverPref);
			}
		}

		window.addEventListener('theme:server-sync', handleServerSync);
		return () => window.removeEventListener('theme:server-sync', handleServerSync);
	}, []);

	const setThemePreference = useCallback((pref: ThemePreference) => {
		localStorage.setItem('themePreference', pref);
		setThemePreferenceState(pref);
	}, []);

	// Backward-compat: cycles light -> dark -> system -> light
	const toggleTheme = useCallback(() => {
		setThemePreference(
			themePreference === 'light' ? 'dark' : themePreference === 'dark' ? 'system' : 'light',
		);
	}, [themePreference, setThemePreference]);

	return (
		<ThemeContext.Provider value={{ theme, themePreference, toggleTheme, setThemePreference }}>
			{children}
		</ThemeContext.Provider>
	);
}

export const useTheme = () => useContext(ThemeContext);
