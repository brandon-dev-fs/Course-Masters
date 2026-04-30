import { useEffect, useRef, useState } from 'react';
import { Plus, FileText, Video, ExternalLink, BookMarked, Brain } from 'lucide-react';
import type { AssignmentType } from '../../api/types.js';

interface AddAssignmentMenuProps {
  onSelect: (type: AssignmentType) => void;
  disabled?: boolean;
}

interface AssignmentTypeOption {
  type: AssignmentType;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const ASSIGNMENT_TYPES: AssignmentTypeOption[] = [
  { type: 'note', label: 'Note', Icon: FileText },
  { type: 'video', label: 'Video', Icon: Video },
  { type: 'reading', label: 'Reading', Icon: ExternalLink },
  { type: 'vocab', label: 'Vocab', Icon: BookMarked },
  { type: 'practice_problem', label: 'Practice Problem', Icon: Brain },
];

export default function AddAssignmentMenu({ onSelect, disabled }: AddAssignmentMenuProps) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  // Focus first item when menu opens
  useEffect(() => {
    if (open) {
      setFocusIndex(0);
      setTimeout(() => itemRefs.current[0]?.focus(), 0);
    }
  }, [open]);

  // Keep focused item in sync
  useEffect(() => {
    if (open) {
      itemRefs.current[focusIndex]?.focus();
    }
  }, [focusIndex, open]);

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(prev => !prev);
    }
    if (e.key === 'ArrowDown' && !open) {
      e.preventDefault();
      setOpen(true);
    }
  }

  function handleMenuKeyDown(e: React.KeyboardEvent) {
    const count = ASSIGNMENT_TYPES.length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusIndex(prev => (prev + 1) % count);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusIndex(prev => (prev - 1 + count) % count);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleSelect(ASSIGNMENT_TYPES[focusIndex].type);
        break;
    }
  }

  function handleSelect(type: AssignmentType) {
    onSelect(type);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen(prev => !prev)}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed',
          'text-sm transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          open
            ? 'border-primary text-foreground bg-surface-raised'
            : 'border-border text-muted-foreground bg-transparent hover:border-primary/50 hover:text-foreground hover:bg-surface-raised',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <Plus className="w-3.5 h-3.5" />
        Add assignment
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Assignment types"
          onKeyDown={handleMenuKeyDown}
          className="absolute z-20 mt-1 bg-surface-raised border border-border shadow-warm-md rounded-xl py-1.5 min-w-[180px]"
        >
          {ASSIGNMENT_TYPES.map(({ type, label, Icon }, idx) => (
            <button
              key={type}
              ref={el => { itemRefs.current[idx] = el; }}
              type="button"
              role="menuitem"
              tabIndex={focusIndex === idx ? 0 : -1}
              onClick={() => handleSelect(type)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-surface rounded-lg cursor-pointer transition-colors w-full text-left"
            >
              <Icon className="w-4 h-4 text-muted-foreground" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
