import { useEffect, useRef, useState } from 'react';
import { FileText, Video, ExternalLink, BookMarked, Dumbbell, Loader2 } from 'lucide-react';

import type { AssignmentType } from '../../api/types.js';

interface ActivityTypeMenuProps {
  onSelect: (type: AssignmentType) => Promise<void>;
  onClose: () => void;
}

interface ActivityTypeOption {
  type: AssignmentType;
  label: string;
  icon: React.ReactNode;
}

const OPTIONS: ActivityTypeOption[] = [
  { type: 'note', label: 'Note', icon: <FileText className="w-4 h-4" /> },
  { type: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
  { type: 'reading', label: 'External Link', icon: <ExternalLink className="w-4 h-4" /> },
  { type: 'vocab', label: 'Vocab', icon: <BookMarked className="w-4 h-4" /> },
  { type: 'practice_problem', label: 'Practice Problem', icon: <Dumbbell className="w-4 h-4" /> },
];

const TYPE_ICON_CLASS: Record<AssignmentType, string> = {
  note: 'text-blue-surface-text',
  video: 'text-orange-surface-text',
  reading: 'text-muted-foreground',
  vocab: 'text-green-surface-text',
  practice_problem: 'text-purple-surface-text',
  file: 'text-muted-foreground',
};

export default function ActivityTypeMenu({ onSelect, onClose }: ActivityTypeMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [creatingType, setCreatingType] = useState<AssignmentType | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    const firstItem = menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
    firstItem?.focus();
  }, []);

  function handleKeyDownMenu(e: React.KeyboardEvent<HTMLDivElement>) {
    const menuItems = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ?? [],
    );
    const current = document.activeElement;
    const idx = menuItems.indexOf(current as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      menuItems[(idx + 1) % menuItems.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      menuItems[(idx - 1 + menuItems.length) % menuItems.length]?.focus();
    }
  }

  async function handleSelect(type: AssignmentType) {
    if (creatingType) return;
    setCreatingType(type);
    try {
      await onSelect(type);
      onClose();
    } catch {
      setCreatingType(null);
    }
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Select activity type"
      className="absolute left-0 mt-1 w-48 bg-surface-raised border border-border rounded-xl shadow-warm-md z-30 py-1"
      onKeyDown={handleKeyDownMenu}
    >
      {OPTIONS.map((option) => {
        const isCreating = creatingType === option.type;
        return (
          <button
            key={option.type}
            type="button"
            role="menuitem"
            disabled={creatingType !== null}
            onClick={() => handleSelect(option.type)}
            className={`flex items-center gap-2 px-3 py-2 text-sm w-full text-left rounded-lg mx-1 cursor-pointer transition-colors
              text-text-primary hover:bg-surface
              disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ width: 'calc(100% - 0.5rem)' }}
          >
            <span className={`w-4 h-4 shrink-0 ${TYPE_ICON_CLASS[option.type]}`} aria-hidden="true">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : option.icon}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
