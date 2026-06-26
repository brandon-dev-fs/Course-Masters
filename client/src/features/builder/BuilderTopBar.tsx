import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, MoreVertical, X } from 'lucide-react';

interface BuilderTopBarProps {
  courseId: string;
  courseTitle: string;
  sidebarContent: React.ReactNode;
}

export default function BuilderTopBar({ courseId, courseTitle, sidebarContent }: BuilderTopBarProps) {
  const [mobileOverflowOpen, setMobileOverflowOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
      {/* Breadcrumb + badge */}
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-text-primary transition-colors">
                My courses
              </Link>
            </li>
            <li aria-hidden="true" className="select-none">/</li>
            <li
              className="text-text-primary font-medium truncate max-w-xs"
              aria-current="page"
            >
              {courseTitle}
            </li>
          </ol>
        </nav>

        <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-surface text-blue-surface-text">
          Builder
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          to={`/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-xl
            border border-border bg-surface hover:bg-surface-raised text-text-primary
            transition-colors shadow-warm-sm"
          aria-label="Preview course as student"
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Preview as student</span>
        </Link>

        {/* Mobile overflow — shows sidebar content */}
        <div className="relative lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOverflowOpen((o) => !o)}
            aria-label="More options"
            aria-haspopup="dialog"
            aria-expanded={mobileOverflowOpen}
            className="p-1.5 rounded-xl border border-border bg-surface hover:bg-surface-raised
              text-text-primary transition-colors shadow-warm-sm"
          >
            <MoreVertical className="w-4 h-4" aria-hidden="true" />
          </button>

          {mobileOverflowOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                aria-hidden="true"
                onClick={() => setMobileOverflowOpen(false)}
              />
              {/* Panel */}
              <div
                role="dialog"
                aria-label="Course details"
                className="absolute right-0 top-full mt-2 w-72 bg-surface-raised border border-border rounded-xl shadow-warm-lg z-50 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-text-primary">Course Details</span>
                  <button
                    type="button"
                    onClick={() => setMobileOverflowOpen(false)}
                    aria-label="Close"
                    className="p-1 rounded-lg text-muted-foreground hover:text-text-primary hover:bg-surface transition-colors"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                {sidebarContent}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
