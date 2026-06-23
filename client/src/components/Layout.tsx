import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
	GraduationCap,
	Sun,
	Moon,
	Monitor,
	UserCircle,
	LogOut,
	ShieldCheck,
} from 'lucide-react';
import Button from './Button.js';
import Footer from './Footer.js';
import MobileDrawer from './MobileDrawer.js';


export default function Layout() {
	const { theme, themePreference, setThemePreference } = useTheme();
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const [drawerOpen, setDrawerOpen] = useState(false);
	// Initialize synchronously from current scroll position to avoid FOUC (NFR-01)
	const [hasScrolled, setHasScrolled] = useState(() => window.scrollY > 0);
	const hamburgerRef = useRef<HTMLButtonElement>(null);

	// Hero overlay applies only on the guest landing page in light mode
	const isHeroPage = location.pathname === '/' && user === null;
	const isHeroOverlay = isHeroPage && !hasScrolled && theme !== 'dark';

	// Attach scroll listener only when on the guest hero page
	useEffect(() => {
		if (!isHeroPage) {
			setHasScrolled(false);
			return;
		}

		function handleScroll() {
			setHasScrolled(window.scrollY > 0);
		}

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, [isHeroPage]);

	// Close drawer on route change
	useEffect(() => {
		setDrawerOpen(false);
	}, [location.pathname]);

	async function handleLogout() {
		await logout();
		navigate('/');
	}

	const headerClass = isHeroOverlay
		? 'sticky top-0 z-40 bg-transparent px-6 py-4 flex items-center justify-between transition-colors duration-300'
		: 'sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border shadow-warm-sm px-6 py-4 flex items-center justify-between transition-colors duration-300';

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col">
			<header className={headerClass}>
				<Link
					to="/"
					className="text-xl font-bold text-primary hover:opacity-80 transition-opacity flex items-center gap-2"
				>
					<GraduationCap className="w-6 h-6" />
					<span>Course Masters</span>
				</Link>

				{/* Inline nav items — hidden below md breakpoint */}
				<div className="hidden md:flex items-center gap-1">
					<button
						onClick={() =>
							setThemePreference(
								themePreference === 'light' ? 'dark' : themePreference === 'dark' ? 'system' : 'light',
							)
						}
						className="w-10 h-10 flex items-center justify-center transition-colors rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface"
						aria-label="Toggle theme"
					>
						{themePreference === 'light' ? (
							<Sun className="w-5 h-5" />
						) : themePreference === 'dark' ? (
							<Moon className="w-5 h-5" />
						) : (
							<Monitor className="w-5 h-5" />
						)}
					</button>
					{!user && (
						<>
							<Link to="/login">
								<Button
									variant="ghost"
									size="sm"
									className=""
								>
									Sign In
								</Button>
							</Link>
							<Link to="/register">
								<Button
									variant="primary"
									size="sm"
								>
									Sign Up
								</Button>
							</Link>
						</>
					)}
					{user && (
						<>
							{user.role === 'admin' && (
								<Link
									to="/admin/users"
									className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-surface"
									aria-label="Admin"
								>
									<ShieldCheck className="w-5 h-5" />
									<span className="hidden sm:inline font-medium">
										Admin
									</span>
								</Link>
							)}
							<Link
								to="/profile"
								className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-surface"
								aria-label="Profile"
							>
								<UserCircle className="w-5 h-5" />
								<span className="hidden sm:inline font-medium">
									{user.name}
								</span>
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

				{/* Hamburger button — visible only below md breakpoint */}
				<button
					ref={hamburgerRef}
					onClick={() => setDrawerOpen(true)}
					aria-label="Open navigation menu"
					aria-expanded={drawerOpen}
					aria-controls="mobile-nav-drawer"
					className="md:hidden w-11 h-11 flex items-center justify-center transition-colors rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2 text-muted-foreground hover:text-foreground hover:bg-surface"
				>
					<Menu className="w-5 h-5" />
				</button>
			</header>

			<MobileDrawer
				isOpen={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				focusReturnRef={hamburgerRef}
			/>

			<main className="flex-1 flex flex-col">
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}
