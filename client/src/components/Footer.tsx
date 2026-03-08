const techChips = [
  { label: 'React', href: 'https://react.dev' },
  { label: 'Tailwind CSS', href: 'https://tailwindcss.com' },
  { label: 'Prisma', href: 'https://prisma.io' },
  { label: 'Claude AI by Anthropic', href: 'https://anthropic.com' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-16">
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-primary font-bold text-lg">Course Masters</span>
            <p className="text-sm text-muted-foreground">Master anything, one lesson at a time.</p>
            <p className="text-xs text-muted-foreground mt-1">
              &copy; {new Date().getFullYear()} Course Masters. All rights reserved.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Powered by</p>
            <div className="flex flex-wrap gap-2">
              {techChips.map(chip => (
                <a
                  key={chip.label}
                  href={chip.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1 rounded-full bg-surface-raised border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                >
                  {chip.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
