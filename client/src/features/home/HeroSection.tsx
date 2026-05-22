import { Link } from 'react-router-dom';

import SolarSystemSvg from './SolarSystemSvg.js';

interface HeroSectionProps {
	loggedIn: boolean;
	userName?: string;
}

export default function HeroSection({ loggedIn, userName = '' }: HeroSectionProps) {
	if (loggedIn) {
		return (
			<section
				aria-label="Hero"
				className="w-full py-6 px-5 bg-hero-deep md:py-8 md:px-6"
			>
				<div className="max-w-7xl mx-auto">
					<h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
						Welcome back, {userName}.
					</h1>
				</div>
			</section>
		);
	}

	return (
		<section
			aria-label="Hero"
			className="w-full py-20 px-6 bg-hero-deep"
		>
			<div className="max-w-7xl mx-auto grid grid-cols-1 gap-12 items-center md:grid-cols-2">
				{/* Left column: text + CTAs */}
				<div className="flex flex-col justify-center text-center md:text-left">
					<h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4 md:mb-5">
						Master anything,
						<br />
						one lesson at a time.
					</h1>
					<p className="text-base md:text-lg text-white/70 mb-7 md:mb-8 leading-relaxed max-w-lg">
						Build structured courses, organize your knowledge into
						units and lessons, and reinforce learning with flash
						cards, practice problems, and progress-tracked
						assessments.
					</p>
					<div className="flex flex-col gap-3 w-full sm:flex-row sm:w-auto">
						<Link
							to="/register"
							className="inline-flex items-center justify-center gap-2 font-semibold transition-all px-6 py-3 text-base rounded-2xl bg-primary text-white shadow-warm-sm hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-hero-deep"
						>
							Get Started
						</Link>
						<Link
							to="/login"
							className="inline-flex items-center justify-center gap-2 font-semibold transition-all px-6 py-3 text-base rounded-2xl border border-white/60 bg-transparent text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-hero-deep"
						>
							Sign In
						</Link>
					</div>
				</div>

				{/* Right column: decorative SVG — overflow visible so outer orbits bleed naturally */}
				<div className="flex items-center justify-center mt-8 md:mt-0 overflow-visible">
					<div className="w-full md:w-[520px]">
						<SolarSystemSvg />
					</div>
				</div>
			</div>
		</section>
	);
}
