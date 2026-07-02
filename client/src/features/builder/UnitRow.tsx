import {
  GripVertical,
  ChevronRight,
  MoreVertical,
  FileEdit,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

import type { BuilderUnit, BuilderLesson, BuilderActivity, ReorderItem } from '../../api/types.js';

import LessonRow from './LessonRow.js';
import AssessmentRow from './AssessmentRow.js';
import AddItemButton from './AddItemButton.js';
import InlineRenameInput from './InlineRenameInput.js';
import DropdownMenu from './DropdownMenu.js';
import { useContextMenu } from './hooks/useContextMenu.js';
import { useDragReorder } from './hooks/useDragReorder.js';

interface SortableLessonRowProps {
  lesson: BuilderLesson;
  unitId: string;
  isExpanded: boolean;
  renamingId: string | null;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onRename: (unitId: string, lessonId: string, title: string) => Promise<void>;
  onStartRename: (id: string) => void;
  onCancelRename: () => void;
  onDelete: () => void;
  onDeleteActivity: (assignmentId: string) => void;
  onEditActivity: (assignmentId: string) => void;
  onAddActivity: () => void;
  onReorderActivities: (reordered: BuilderActivity[], assignmentIds: string[]) => Promise<void>;
  onMoveLesson: (direction: 'up' | 'down') => void;
  onMoveActivity: (assignmentId: string, direction: 'up' | 'down') => void;
  onEditPlan: () => void;
  announce: (message: string) => void;
}

function SortableLessonRow({
  lesson,
  unitId,
  isExpanded,
  renamingId,
  isFirst,
  isLast,
  onToggle,
  onRename,
  onStartRename,
  onCancelRename,
  onDelete,
  onDeleteActivity,
  onEditActivity,
  onAddActivity,
  onReorderActivities,
  onMoveLesson,
  onMoveActivity,
  onEditPlan,
  announce,
}: SortableLessonRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LessonRow
        lesson={lesson}
        unitId={unitId}
        isExpanded={isExpanded}
        renamingId={renamingId}
        isFirst={isFirst}
        isLast={isLast}
        onToggle={onToggle}
        onRename={onRename}
        onStartRename={onStartRename}
        onCancelRename={onCancelRename}
        onDelete={onDelete}
        onDeleteActivity={onDeleteActivity}
        onEditActivity={onEditActivity}
        onAddActivity={onAddActivity}
        onReorderActivities={onReorderActivities}
        onMoveLesson={onMoveLesson}
        onMoveActivity={onMoveActivity}
        onEditPlan={onEditPlan}
        announce={announce}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

interface UnitRowProps {
  unit: BuilderUnit;
  courseId: string;
  isExpanded: boolean;
  expandedLessons: Set<string>;
  renamingId: string | null;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onToggleLesson: (lessonId: string) => void;
  onRename: (courseId: string, unitId: string, title: string) => Promise<void>;
  onRenameLesson: (unitId: string, lessonId: string, title: string) => Promise<void>;
  onStartRename: (id: string) => void;
  onCancelRename: () => void;
  onDelete: () => void;
  onDeleteLesson: (lessonId: string) => void;
  onDeleteActivity: (lessonId: string, assignmentId: string) => void;
  onEditActivity: (assignmentId: string) => void;
  onAddLesson: () => void;
  onAddActivity: (lessonId: string) => void;
  onReorderLessons: (reordered: BuilderLesson[], items: ReorderItem[]) => Promise<void>;
  onReorderActivities: (lessonId: string, reordered: BuilderActivity[], assignmentIds: string[]) => Promise<void>;
  onMoveUnit: (direction: 'up' | 'down') => void;
  onMoveLesson: (lessonId: string, direction: 'up' | 'down') => void;
  onMoveActivity: (lessonId: string, assignmentId: string, direction: 'up' | 'down') => void;
  onEditUnit: () => void;
  onEditPlanLesson: (lessonId: string) => void;
  announce: (message: string) => void;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

export default function UnitRow({
  unit,
  courseId,
  isExpanded,
  expandedLessons,
  renamingId,
  isFirst,
  isLast,
  onToggle,
  onToggleLesson,
  onRename,
  onRenameLesson,
  onStartRename,
  onCancelRename,
  onDelete,
  onDeleteLesson,
  onDeleteActivity,
  onEditActivity,
  onAddLesson,
  onAddActivity,
  onReorderLessons,
  onReorderActivities,
  onMoveUnit,
  onMoveLesson,
  onMoveActivity,
  onEditUnit,
  onEditPlanLesson,
  announce,
  dragHandleProps,
  isDragging = false,
}: UnitRowProps) {
  const { isOpen: menuOpen, open: openMenu, close: closeMenu, triggerRef: menuTriggerRef } = useContextMenu();
  const isRenaming = renamingId === unit.id;
  const childGroupId = `unit-children-${unit.id}`;

  const sortedLessons = [...unit.lessons].sort((a, b) => a.order - b.order);

  const { sensors, handleDragEnd } = useDragReorder({
    items: sortedLessons,
    onReorder: async (reordered, items) => {
      await onReorderLessons(reordered, items);
    },
    onRollback: () => {
      announce('Reorder failed. Order restored.');
    },
    announce,
    getItemLabel: (l) => l.title,
  });

  const menuItems = [
    {
      label: 'Edit details',
      icon: <FileEdit className="w-4 h-4" />,
      onClick: onEditUnit,
    },
    {
      label: 'Move up',
      icon: <ChevronUp className="w-4 h-4" />,
      onClick: () => onMoveUnit('up'),
      disabled: isFirst,
    },
    {
      label: 'Move down',
      icon: <ChevronDown className="w-4 h-4" />,
      onClick: () => onMoveUnit('down'),
      disabled: isLast,
    },
    {
      label: 'Delete unit',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: onDelete,
      variant: 'destructive' as const,
      dividerBefore: true,
    },
  ];

  function handleMoveLesson(lessonId: string, direction: 'up' | 'down') {
    const sorted = [...unit.lessons].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((l) => l.id === lessonId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const withOrder = reordered.map((l, i) => ({ ...l, order: i + 1 }));
    const items: ReorderItem[] = withOrder.map((l) => ({ id: l.id, order: l.order }));
    onReorderLessons(withOrder, items).catch(() => {});
    onMoveLesson(lessonId, direction);
  }

  return (
    <div
      role="treeitem"
      aria-expanded={isExpanded}
      aria-level={1}
      aria-label={`Unit: ${unit.title}`}
      aria-controls={isExpanded ? childGroupId : undefined}
      className={`border-b border-border-subtle last:border-b-0 ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Unit header row */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors group cursor-pointer">
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

        {/* Expand/collapse button */}
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={childGroupId}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} unit: ${unit.title}`}
          onClick={onToggle}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
        >
          <ChevronRight
            className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />

          {isRenaming ? (
            <InlineRenameInput
              initialValue={unit.title}
              onSave={(title) => onRename(courseId, unit.id, title)}
              onCancel={onCancelRename}
              ariaLabel="Rename unit"
            />
          ) : (
            <span className="text-sm font-semibold text-text-primary truncate">
              {unit.title}
            </span>
          )}
        </button>

        {/* Lesson count badge */}
        {!isRenaming && (
          <span className="text-xs text-muted-foreground shrink-0">
            {unit.lessons.length} {unit.lessons.length === 1 ? 'lesson' : 'lessons'}
          </span>
        )}

        {/* Context menu */}
        <div className="relative">
          <button
            ref={menuTriggerRef}
            type="button"
            aria-label={`Actions for unit: ${unit.title}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={openMenu}
            className="p-1 rounded-lg text-muted-foreground hover:text-text-primary hover:bg-surface transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          >
            <MoreVertical className="w-4 h-4" aria-hidden="true" />
          </button>
          {menuOpen && (
            <DropdownMenu
              items={menuItems}
              onClose={closeMenu}
              ariaLabel={`Actions for ${unit.title}`}
            />
          )}
        </div>
      </div>

      {/* Children */}
      {isExpanded && (
        <div id={childGroupId} role="group" className="pb-2">
          {/* Unit description */}
          <p className="text-xs pl-9 pr-3 pb-1.5">
            {unit.description
              ? <span className="text-text-secondary">{unit.description}</span>
              : <span className="text-muted-foreground italic">No description</span>
            }
          </p>

          {sortedLessons.length === 0 && (
            <p className="text-sm text-muted-foreground italic px-3 py-1.5 ml-8">
              No lessons in this unit.
            </p>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedLessons.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedLessons.map((lesson, i) => (
                <SortableLessonRow
                  key={lesson.id}
                  lesson={lesson}
                  unitId={unit.id}
                  isExpanded={expandedLessons.has(lesson.id)}
                  renamingId={renamingId}
                  isFirst={i === 0}
                  isLast={i === sortedLessons.length - 1}
                  onToggle={() => onToggleLesson(lesson.id)}
                  onRename={onRenameLesson}
                  onStartRename={onStartRename}
                  onCancelRename={onCancelRename}
                  onDelete={() => onDeleteLesson(lesson.id)}
                  onDeleteActivity={(assignmentId) => onDeleteActivity(lesson.id, assignmentId)}
                  onEditActivity={onEditActivity}
                  onAddActivity={() => onAddActivity(lesson.id)}
                  onReorderActivities={(reordered, assignmentIds) =>
                    onReorderActivities(lesson.id, reordered, assignmentIds)
                  }
                  onMoveLesson={(dir) => handleMoveLesson(lesson.id, dir)}
                  onMoveActivity={(assignmentId, dir) => onMoveActivity(lesson.id, assignmentId, dir)}
                  onEditPlan={() => onEditPlanLesson(lesson.id)}
                  announce={announce}
                />
              ))}
            </SortableContext>
          </DndContext>

          <div className="ml-4 md:ml-8 mt-1">
            <AddItemButton
              label="Add lesson"
              onClick={onAddLesson}
            />
          </div>

          {/* Unit test */}
          <AssessmentRow
            assessment={unit.assessment}
            label="Unit test"
            level={2}
            indentClass="ml-4 md:ml-8"
          />
        </div>
      )}
    </div>
  );
}
