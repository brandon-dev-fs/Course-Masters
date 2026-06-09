const techChips = [
  { label: 'React', href: 'https://react.dev' },
  { label: 'Vite', href: 'https://vitejs.dev' },
  { label: 'Tailwind CSS', href: 'https://tailwindcss.com' },
  { label: 'Express', href: 'https://expressjs.com' },
  { label: 'PostgreSQL', href: 'https://www.postgresql.org' },
  { label: 'Prisma', href: 'https://prisma.io' },
  { label: 'Better Auth', href: 'https://www.better-auth.com' },
  { label: 'Tiptap', href: 'https://tiptap.dev' },
  { label: 'KaTeX', href: 'https://katex.org' },
  { label: 'Lucide Icons', href: 'https://lucide.dev' },
  { label: 'Claude AI by Anthropic', href: 'https://anthropic.com' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-primary font-bold text-lg">Course Masters</span>
            <p className="text-sm text-muted-foreground">Master anything, one lesson at a time.</p>
            <p className="text-xs text-muted-foreground mt-1">
              &copy; {new Date().getFullYear()} Course Masters. All rights reserved.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Powered by</p>
            <div className="flex flex-wrap gap-1">
              {techChips.map(chip => (
                <a
                  key={chip.label}
                  href={chip.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] px-2 py-0.5 rounded-full bg-surface-raised border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
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
