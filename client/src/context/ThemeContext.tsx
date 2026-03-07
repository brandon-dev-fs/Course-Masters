import {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from 'react';

type Theme = 'dark' | 'light';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
	theme: 'dark',
	toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<Theme>(() => {
		return (localStorage.getItem('theme') as Theme) ?? 'dark';
	});

	useEffect(() => {
		document.documentElement.classList.toggle('dark', theme === 'dark');
		localStorage.setItem('theme', theme);
	}, [theme]);

	function toggleTheme() {
		setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
	}

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export const useTheme = () => useContext(ThemeContext);
