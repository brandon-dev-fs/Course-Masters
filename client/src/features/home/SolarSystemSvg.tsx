export default function SolarSystemSvg() {
	return (
		<svg
			viewBox="0 0 480 480"
			width="100%"
			aria-hidden="true"
			focusable="false"
			xmlns="http://www.w3.org/2000/svg"
		>
			<style>{`
				@keyframes orbit {
					from { transform: rotate(0deg); }
					to   { transform: rotate(360deg); }
				}

				@keyframes sunPulse {
					0%, 100% { transform: scale(1); }
					50%       { transform: scale(1.08); }
				}

				@keyframes twinkle {
					0%, 100% { opacity: 0.2; }
					50%       { opacity: 1.0; }
				}

				.orbit1 { transform-origin: 240px 240px; animation: orbit 3s linear infinite; }
				.orbit2 { transform-origin: 240px 240px; animation: orbit 7.5s linear infinite; }
				.orbit3 { transform-origin: 240px 240px; animation: orbit 12s linear infinite; }
				.orbit4 { transform-origin: 240px 240px; animation: orbit 22.5s linear infinite; }
				.orbit5 { transform-origin: 240px 240px; animation: orbit 142s linear infinite; }
				.orbit6 { transform-origin: 240px 240px; animation: orbit 353s linear infinite; }
				.orbit7 { transform-origin: 240px 240px; animation: orbit 1008s linear infinite; }
				.orbit8 { transform-origin: 240px 240px; animation: orbit 1978s linear infinite; }

				.sun { transform-origin: 240px 240px; animation: sunPulse 3s ease-in-out infinite; }

				.twinkle-a { animation: twinkle 2s ease-in-out infinite; }
				.twinkle-b { animation: twinkle 3s ease-in-out infinite; }
				.twinkle-c { animation: twinkle 4s ease-in-out infinite; }
			`}</style>

			{/* Layer 1: Star field */}
			<g>
				{/* twinkle-a stars */}
				<circle className="twinkle-a" cx="18"  cy="42"  r="1.2" fill="white" />
				<circle className="twinkle-a" cx="55"  cy="120" r="1"   fill="white" />
				<circle className="twinkle-a" cx="430" cy="35"  r="1.3" fill="white" />
				<circle className="twinkle-a" cx="460" cy="200" r="1"   fill="white" />
				<circle className="twinkle-a" cx="390" cy="430" r="1.2" fill="white" />
				<circle className="twinkle-a" cx="22"  cy="380" r="1"   fill="white" />
				<circle className="twinkle-a" cx="100" cy="460" r="1.1" fill="white" />
				{/* twinkle-b stars */}
				<circle className="twinkle-b" cx="90"  cy="70"  r="1"   fill="white" />
				<circle className="twinkle-b" cx="150" cy="20"  r="1.2" fill="white" />
				<circle className="twinkle-b" cx="370" cy="80"  r="1"   fill="white" />
				<circle className="twinkle-b" cx="450" cy="130" r="1.3" fill="white" />
				<circle className="twinkle-b" cx="460" cy="340" r="1"   fill="white" />
				<circle className="twinkle-b" cx="340" cy="460" r="1.2" fill="white" />
				<circle className="twinkle-b" cx="30"  cy="290" r="1"   fill="white" />
				<circle className="twinkle-b" cx="10"  cy="170" r="1.1" fill="white" />
				{/* twinkle-c stars */}
				<circle className="twinkle-c" cx="200" cy="10"  r="1.2" fill="white" />
				<circle className="twinkle-c" cx="300" cy="15"  r="1"   fill="white" />
				<circle className="twinkle-c" cx="420" cy="310" r="1.3" fill="white" />
				<circle className="twinkle-c" cx="470" cy="400" r="1"   fill="white" />
				<circle className="twinkle-c" cx="250" cy="470" r="1.2" fill="white" />
				<circle className="twinkle-c" cx="60"  cy="440" r="1"   fill="white" />
			</g>

			{/* Layer 2: Orbit rings */}
			{/* Mercury */}
			<circle cx="240" cy="240" r="52"  fill="none" stroke="#b5b5b5" strokeOpacity="0.3" strokeWidth="1" />
			{/* Venus */}
			<circle cx="240" cy="240" r="76"  fill="none" stroke="#e8cda0" strokeOpacity="0.3" strokeWidth="1" />
			{/* Earth */}
			<circle cx="240" cy="240" r="100" fill="none" stroke="#4fa3e0" strokeOpacity="0.3" strokeWidth="1" />
			{/* Mars */}
			<circle cx="240" cy="240" r="128" fill="none" stroke="#c1440e" strokeOpacity="0.3" strokeWidth="1" />
			{/* Jupiter */}
			<circle cx="240" cy="240" r="164" fill="none" stroke="#c88b3a" strokeOpacity="0.3" strokeWidth="1" />
			{/* Saturn */}
			<circle cx="240" cy="240" r="196" fill="none" stroke="#e8d5a3" strokeOpacity="0.3" strokeWidth="1" />
			{/* Uranus */}
			<circle cx="240" cy="240" r="230" fill="none" stroke="#7de8e8" strokeOpacity="0.3" strokeWidth="1" />
			{/* Neptune */}
			<circle cx="240" cy="240" r="262" fill="none" stroke="#5b7fdb" strokeOpacity="0.3" strokeWidth="1" />

			{/* Layer 3: Sun */}
			<circle className="sun" cx="240" cy="240" r="28" fill="#FDB813" />

			{/* Planets */}
			{/* Mercury */}
			<g className="orbit1">
				<circle cx="292" cy="240" r="4" fill="#b5b5b5" />
			</g>

			{/* Venus */}
			<g className="orbit2">
				<circle cx="316" cy="240" r="5" fill="#e8cda0" />
			</g>

			{/* Earth */}
			<g className="orbit3">
				<circle cx="340" cy="240" r="6" fill="#4fa3e0" />
			</g>

			{/* Mars */}
			<g className="orbit4">
				<circle cx="368" cy="240" r="5" fill="#c1440e" />
			</g>

			{/* Jupiter */}
			<g className="orbit5">
				<circle cx="404" cy="240" r="10" fill="#c88b3a" />
			</g>

			{/* Saturn */}
			<g className="orbit6">
				<circle cx="436" cy="240" r="8" fill="#e8d5a3" />
				<ellipse
					cx="436"
					cy="240"
					rx="14"
					ry="5"
					fill="none"
					stroke="#e8d5a3"
					strokeOpacity="0.6"
					strokeWidth="2"
					transform="rotate(-20, 436, 240)"
				/>
			</g>

			{/* Uranus */}
			<g className="orbit7">
				<circle cx="470" cy="240" r="7" fill="#7de8e8" />
			</g>

			{/* Neptune — clipped slightly inside viewBox at max orbit 262, 240+262=502, but SVG clips naturally */}
			<g className="orbit8">
				<circle cx="502" cy="240" r="7" fill="#5b7fdb" />
			</g>
		</svg>
	);
}
