import { GripVertical, MoreVertical, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

import type { BuilderActivity } from '../../api/types.js';

import ActivityTypePill from './ActivityTypePill.js';
import DropdownMenu from './DropdownMenu.js';
import { useContextMenu } from './hooks/useContextMenu.js';

interface ActivityRowProps {
  activity: BuilderActivity;
  isFirst: boolean;
  isLast: boolean;
  onDelete: () => void;
  onMoveActivity: (direction: 'up' | 'down') => void;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

export default function ActivityRow({
  activity,
  isFirst,
  isLast,
  onDelete,
  onMoveActivity,
  dragHandleProps,
  isDragging = false,
}: ActivityRowProps) {
  const { isOpen, open, close, triggerRef } = useContextMenu();

  const menuItems = [
    // Move up/down — shown on mobile (no drag handles)
    {
      label: 'Move up',
      icon: <ChevronUp className="w-4 h-4" />,
      onClick: () => onMoveActivity('up'),
      disabled: isFirst,
      dividerBefore: false,
    },
    {
      label: 'Move down',
      icon: <ChevronDown className="w-4 h-4" />,
      onClick: () => onMoveActivity('down'),
      disabled: isLast,
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: onDelete,
      variant: 'destructive' as const,
      dividerBefore: true,
    },
  ];

  return (
    <div
      role="treeitem"
      aria-level={3}
      aria-label={`${activity.type}: ${activity.title}`}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface transition-colors group
        ml-8 md:ml-16
        ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Drag handle — desktop only */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="hidden md:flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab w-4 h-4 shrink-0"
        {...(dragHandleProps ?? {})}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <ActivityTypePill type={activity.type} />

      <span className="flex-1 text-sm text-text-primary truncate min-w-0">
        {activity.title}
      </span>

      {/* Context menu */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          aria-label={`Actions for ${activity.title}`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={open}
          className="p-1 rounded-lg text-muted-foreground hover:text-text-primary hover:bg-surface transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        >
          <MoreVertical className="w-4 h-4" aria-hidden="true" />
        </button>
        {isOpen && (
          <DropdownMenu
            items={menuItems}
            onClose={close}
            ariaLabel={`Actions for ${activity.title}`}
          />
        )}
      </div>
    </div>
  );
}
