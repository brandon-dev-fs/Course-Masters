import { Outlet, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.js';

export default function Layout() {
	const { theme, toggleTheme } = useTheme();

	return (
		<div className="min-h-screen bg-background text-foreground">
			<header className="bg-background border-b border-border px-6 py-4 flex items-center justify-between">
				<Link
					to="/"
					className="text-xl font-bold text-primary hover:opacity-80 transition-opacity"
				>
					Course Masters
				</Link>
				<button
					onClick={toggleTheme}
					className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded hover:bg-surface"
					aria-label="Toggle theme"
				>
					{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
				</button>
			</header>
			<main className="container mx-auto px-6 py-8 max-w-5xl">
				<Outlet />
			</main>
		</div>
	);
}
