import { Outlet, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.js';
import Footer from './Footer.js';

export default function Layout() {
	const { theme, toggleTheme } = useTheme();

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col">
			<header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border shadow-warm-sm px-6 py-4 flex items-center justify-between">
				<Link
					to="/"
					className="text-xl font-bold text-primary hover:opacity-80 transition-opacity flex items-center gap-2"
				>
					<span>🎓</span>
					<span>Course Masters</span>
				</Link>
				<button
					onClick={toggleTheme}
					className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-surface"
					aria-label="Toggle theme"
				>
					{theme === 'dark' ? '🌙' : '☀️'}
				</button>
			</header>
			<main className="container mx-auto px-6 py-10 max-w-5xl flex-1">
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}
