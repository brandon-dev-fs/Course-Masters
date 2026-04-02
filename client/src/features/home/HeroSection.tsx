import Button from '../../components/Button';
import { Link } from 'react-router-dom';

export default function HeroSection({ loggedIn = false }) {
	return (
		<div className="w-full py-14 mb-10 bg-surface border-b border-border">
			<div className="mx-6 px-6 max-w-2xl">
				<h1 className="text-4xl font-bold text-foreground tracking-tight leading-tight mb-4">
					Master anything,
					<br />
					one lesson at a time.
				</h1>

				<p className="text-muted-foreground text-lg mb-6 leading-relaxed">
					Build structured courses, organize your knowledge into units
					and lessons, and reinforce learning with flash cards,
					practice problems, and progress-tracked assessments.
				</p>
				{!loggedIn && (
					<div className="flex gap-3">
						<Link to="/register">
							<Button size="lg">Get Started</Button>
						</Link>
						<Link to="/login">
							<Button
								size="lg"
								variant="secondary"
							>
								Sign In
							</Button>
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}
