import { Bookmark, BookmarkX } from 'lucide-react';

import type { Assignment, Bookmark as BookmarkType } from '../../api/types.js';

interface BookmarkEntry {
  assignment: Assignment;
  bookmark: BookmarkType;
}

interface BookmarksPanelProps {
  assignments: Assignment[];
  onNavigate: (assignmentId: string) => void;
}

export default function BookmarksPanel({ assignments, onNavigate }: BookmarksPanelProps) {
  const bookmarked: BookmarkEntry[] = assignments
    .filter((a): a is Assignment & { bookmark: BookmarkType } => a.bookmark != null)
    .sort((a, b) => a.order - b.order)
    .map(a => ({ assignment: a, bookmark: a.bookmark as BookmarkType }));

  if (bookmarked.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center px-4">
        <Bookmark className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">No bookmarks yet</p>
        <p className="text-xs text-muted-foreground">
          Click the bookmark icon on any assignment to save a note and jump back to it later.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border" role="list">
      {bookmarked.map(({ assignment, bookmark }) => (
        <li key={assignment.id}>
          <button
            type="button"
            onClick={() => onNavigate(assignment.id)}
            className="w-full text-left px-3 py-3 hover:bg-surface-raised transition-colors flex flex-col gap-1 group"
          >
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {assignment.title}
            </span>
            {bookmark.note && (
              <span className="text-xs text-muted-foreground line-clamp-2">
                {bookmark.note}
              </span>
            )}
            <span className="text-xs text-muted-foreground/60">
              Saved {new Date(bookmark.updatedAt).toLocaleDateString()}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
