import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface CourseCardMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

export default function CourseCardMenu({ onEdit, onDelete }: CourseCardMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
        items?.[0]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
        items?.[items.length - 1]?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function handleEdit() {
    onEdit();
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function handleDelete() {
    onDelete();
    setIsOpen(false);
    // No focus return here — ConfirmDialog will open and receive focus
  }

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Course options"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="min-w-[44px] min-h-[44px] w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface-raised hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-primary transition-colors"
      >
        <MoreVertical className="w-4 h-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 top-full mt-1 z-10 bg-surface-raised border border-border-subtle rounded-xl shadow-warm-md py-1 min-w-[140px]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleEdit}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-primary transition-colors"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
            Edit Course
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-primary transition-colors"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Delete Course
          </button>
        </div>
      )}
    </div>
  );
}
