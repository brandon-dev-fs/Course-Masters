export type CourseCategory = 'Mathematics' | 'Science' | 'Language' | 'Music' | 'Other';

export const CATEGORIES: Array<CourseCategory | 'All'> = [
  'All',
  'Mathematics',
  'Language',
  'Science',
  'Music',
  'Other',
];

const KEYWORD_MAP: Record<CourseCategory, string[]> = {
  Mathematics: ['math', 'algebra', 'calculus', 'geometry', 'arithmetic'],
  Science: ['science', 'physics', 'chemistry', 'biology', 'lab'],
  Language: ['language', 'english', 'spanish', 'french', 'writing', 'grammar'],
  Music: ['music', 'guitar', 'piano', 'theory', 'rhythm'],
  Other: [],
};

export function getCourseCategory(title: string): CourseCategory {
  const lower = title.toLowerCase();
  for (const [category, keywords] of Object.entries(KEYWORD_MAP) as Array<
    [CourseCategory, string[]]
  >) {
    if (category === 'Other') continue;
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return 'Other';
}

interface CourseFiltersProps {
  selectedCategory: CourseCategory | 'All';
  onCategoryChange: (category: CourseCategory | 'All') => void;
}

const activePillClass =
  'bg-green-surface text-green-surface-text border-transparent font-semibold';
const inactivePillClass =
  'bg-surface border border-border-subtle text-text-secondary hover:bg-surface-raised hover:text-text-primary';

export default function CourseFilters({
  selectedCategory,
  onCategoryChange,
}: CourseFiltersProps) {
  return (
    <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2 mb-6">
      {CATEGORIES.map((category) => {
        const isActive = selectedCategory === category;
        return (
          <button
            key={category}
            type="button"
            aria-pressed={isActive}
            onClick={() => onCategoryChange(category)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-primary ${
              isActive ? activePillClass : inactivePillClass
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
