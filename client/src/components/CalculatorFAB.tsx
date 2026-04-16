import { forwardRef } from 'react';

export interface CalculatorFABProps {
  isOpen: boolean;
  onToggle: () => void;
  /** Tailwind z-index class — defaults to 'z-30'; pass 'z-60' in assessment context */
  zClass?: string;
}

/**
 * Floating action button that toggles the calculator panel.
 * Uses forwardRef so the parent can return focus here when the panel closes.
 */
const CalculatorFAB = forwardRef<HTMLButtonElement, CalculatorFABProps>(
  function CalculatorFAB({ isOpen, onToggle, zClass = 'z-30' }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? 'Close calculator' : 'Open calculator'}
        aria-expanded={isOpen}
        aria-controls="calculator-panel"
        className={[
          'w-12 h-12 max-sm:w-11 max-sm:h-11',
          'rounded-full flex items-center justify-center',
          'shadow-warm-md',
          'active:scale-95 transition-all duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          isOpen
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-primary'
            : 'bg-charcoal text-charcoal-foreground hover:bg-charcoal/90 focus-visible:outline-charcoal',
          zClass,
        ].join(' ')}
      >
        {/* Calculator icon — aria-hidden because button has aria-label */}
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="8" y2="10" strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1="10" x2="12" y2="10" strokeWidth="3" strokeLinecap="round" />
          <line x1="16" y1="10" x2="16" y2="10" strokeWidth="3" strokeLinecap="round" />
          <line x1="8" y1="14" x2="8" y2="14" strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1="14" x2="12" y2="14" strokeWidth="3" strokeLinecap="round" />
          <line x1="16" y1="14" x2="16" y2="14" strokeWidth="3" strokeLinecap="round" />
          <line x1="8" y1="18" x2="8" y2="18" strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" strokeLinecap="round" />
          <line x1="16" y1="18" x2="16" y2="18" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </button>
    );
  },
);

export default CalculatorFAB;
