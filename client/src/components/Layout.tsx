import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.js';
import { useAuth } from '../context/AuthContext.js';
import { GraduationCap, Sun, Moon, UserCircle, LogOut, ShieldCheck } from 'lucide-react';
import Footer from './Footer.js';

export default function Layout() {
	const { theme, toggleTheme } = useTheme();
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	async function handleLogout() {
		await logout();
		navigate('/login');
	}

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col">
			<header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border shadow-warm-sm px-6 py-4 flex items-center justify-between">
				<Link
					to="/"
					className="text-xl font-bold text-primary hover:opacity-80 transition-opacity flex items-center gap-2"
				>
					<GraduationCap className="w-6 h-6" />
					<span>Course Masters</span>
				</Link>
				<div className="flex items-center gap-1">
					<button
						onClick={toggleTheme}
						className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-surface"
						aria-label="Toggle theme"
					>
						{theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
					</button>
					{user && (
						<>
							{user.role === 'admin' && (
								<Link
									to="/admin/users"
									className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-surface"
									aria-label="Admin"
								>
									<ShieldCheck className="w-5 h-5" />
									<span className="hidden sm:inline font-medium">Admin</span>
								</Link>
							)}
							<Link
								to="/profile"
								className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-surface"
								aria-label="Profile"
							>
								<UserCircle className="w-5 h-5" />
								<span className="hidden sm:inline font-medium">{user.name}</span>
							</Link>
							<button
								onClick={() => void handleLogout()}
								className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-surface"
								aria-label="Sign out"
							>
								<LogOut className="w-5 h-5" />
							</button>
						</>
					)}
				</div>
			</header>
			<main className="container mx-auto px-6 py-10 max-w-5xl flex-1">
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}
