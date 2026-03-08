import Button from '../../components/Button.js';

interface HeroSectionProps {
  hasCourses: boolean;
  onCreateCourse: () => void;
}

const features = [
  { icon: '📚', label: 'Courses' },
  { icon: '📦', label: 'Units' },
  { icon: '📖', label: 'Lessons' },
  { icon: '🃏', label: 'FlashCards' },
  { icon: '🧠', label: 'Practice Problems' },
  { icon: '📈', label: 'Progress Tracking' },
];

export default function HeroSection({ hasCourses, onCreateCourse }: HeroSectionProps) {
  return (
    <div className="-mx-6 px-6 py-14 mb-10 bg-surface border-b border-border">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-subtle text-primary text-sm font-semibold mb-5">
          <span>🎓</span>
          <span>Self-Directed Learning</span>
        </div>

        <h1 className="text-4xl font-bold text-foreground tracking-tight leading-tight mb-4">
          Master anything,<br />one lesson at a time.
        </h1>

        <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
          Build structured courses, organize your knowledge into units and lessons,
          and reinforce learning with flash cards, practice problems, and progress-tracked assessments.
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          {features.map(f => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-raised border border-border text-sm text-foreground shadow-warm-sm"
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={onCreateCourse}>
            + Create your first course
          </Button>
          {hasCourses && (
            <Button
              size="lg"
              variant="accent"
              onClick={() => {
                document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              View my courses
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
