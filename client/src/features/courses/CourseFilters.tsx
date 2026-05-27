import { Search, X } from 'lucide-react';

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
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: CourseCategory | 'All';
  onCategoryChange: (category: CourseCategory | 'All') => void;
}

const activePillClass =
  'bg-green-surface text-green-surface-text border-transparent font-semibold';
const inactivePillClass =
  'bg-surface border border-border-subtle text-text-secondary hover:bg-surface-raised hover:text-text-primary';

export default function CourseFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}: CourseFiltersProps) {
  return (
    <div className="mb-6">
      {/* Search input */}
      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search courses..."
          aria-label="Search courses"
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-green-primary focus:border-green-primary transition-colors"
        />
        {searchQuery !== '' && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
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
    </div>
  );
}
