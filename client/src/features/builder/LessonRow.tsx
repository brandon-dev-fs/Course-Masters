import {
  GripVertical,
  ChevronRight,
  MoreVertical,
  Pencil,
  BookOpen,
  BookMarked,
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

import type { BuilderLesson, BuilderActivity, ReorderItem } from '../../api/types.js';

import ActivityRow from './ActivityRow.js';
import AssessmentRow from './AssessmentRow.js';
import LessonPlanRow from './LessonPlanRow.js';
import AddItemButton from './AddItemButton.js';
import InlineRenameInput from './InlineRenameInput.js';
import DropdownMenu from './DropdownMenu.js';
import { useContextMenu } from './hooks/useContextMenu.js';
import { useDragReorder } from './hooks/useDragReorder.js';

interface SortableActivityRowProps {
  activity: BuilderActivity;
  isFirst: boolean;
  isLast: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onMoveActivity: (direction: 'up' | 'down') => void;
}

function SortableActivityRow({
  activity,
  isFirst,
  isLast,
  onDelete,
  onEdit,
  onMoveActivity,
}: SortableActivityRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ActivityRow
        activity={activity}
        isFirst={isFirst}
        isLast={isLast}
        onDelete={onDelete}
        onEdit={onEdit}
        onMoveActivity={onMoveActivity}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

interface LessonRowProps {
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
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

export default function LessonRow({
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
  dragHandleProps,
  isDragging = false,
}: LessonRowProps) {
  const { isOpen: menuOpen, open: openMenu, close: closeMenu, triggerRef: menuTriggerRef } = useContextMenu();
  const isRenaming = renamingId === lesson.id;
  const childGroupId = `lesson-children-${lesson.id}`;

  const { sensors, handleDragEnd } = useDragReorder({
    items: lesson.assignments,
    onReorder: async (reordered, items) => {
      const assignmentIds = reordered.map((a) => a.id);
      await onReorderActivities(reordered, assignmentIds);
    },
    onRollback: (snapshot) => {
      // The parent's onReorderActivities will handle rollback via setOutline
      // For now just announce
      announce('Reorder failed. Order restored.');
    },
    announce,
    getItemLabel: (a) => a.title,
  });

  const menuItems = [
    {
      label: 'Rename',
      icon: <Pencil className="w-4 h-4" />,
      onClick: () => onStartRename(lesson.id),
    },
    {
      label: 'Edit plan',
      icon: <BookOpen className="w-4 h-4" />,
      onClick: onEditPlan,
    },
    {
      label: 'Move up',
      icon: <ChevronUp className="w-4 h-4" />,
      onClick: () => onMoveLesson('up'),
      disabled: isFirst,
    },
    {
      label: 'Move down',
      icon: <ChevronDown className="w-4 h-4" />,
      onClick: () => onMoveLesson('down'),
      disabled: isLast,
    },
    {
      label: 'Delete lesson',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: onDelete,
      variant: 'destructive' as const,
      dividerBefore: true,
    },
  ];

  const sortedActivities = [...lesson.assignments].sort((a, b) => a.order - b.order);

  function handleMoveActivity(assignmentId: string, direction: 'up' | 'down') {
    const sorted = [...lesson.assignments].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((a) => a.id === assignmentId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const reordered = [...sorted];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const withOrder = reordered.map((a, i) => ({ ...a, order: i + 1 }));
    const assignmentIds = withOrder.map((a) => a.id);
    onMoveActivity(assignmentId, direction);
    onReorderActivities(withOrder, assignmentIds).catch(() => {});
  }

  return (
    <div
      role="treeitem"
      aria-expanded={isExpanded}
      aria-level={2}
      aria-label={`Lesson: ${lesson.title}`}
      aria-controls={isExpanded ? childGroupId : undefined}
      className={`${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Lesson header row */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors group cursor-pointer ml-4 md:ml-8">
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

        {/* Expand/collapse */}
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={childGroupId}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} lesson: ${lesson.title}`}
          onClick={onToggle}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
        >
          <ChevronRight
            className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />

          {isRenaming ? (
            <InlineRenameInput
              initialValue={lesson.title}
              onSave={(title) => onRename(unitId, lesson.id, title)}
              onCancel={onCancelRename}
              ariaLabel="Rename lesson"
            />
          ) : (
            <>
              <span className="text-sm font-medium text-text-primary truncate">
                {lesson.title}
              </span>
              {lesson.hasLessonPlan ? (
                <BookMarked
                  className="w-3.5 h-3.5 shrink-0 text-primary"
                  aria-label="Lesson plan set"
                />
              ) : (
                <BookOpen
                  className="w-3.5 h-3.5 shrink-0 text-muted-foreground opacity-40"
                  aria-label="No lesson plan"
                />
              )}
            </>
          )}
        </button>

        {/* Activity count badge */}
        {!isRenaming && (
          <span className="text-xs text-muted-foreground shrink-0">
            {lesson.assignments.length} {lesson.assignments.length === 1 ? 'activity' : 'activities'}
          </span>
        )}

        {/* Context menu */}
        <div className="relative">
          <button
            ref={menuTriggerRef}
            type="button"
            aria-label={`Actions for lesson: ${lesson.title}`}
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
              ariaLabel={`Actions for ${lesson.title}`}
            />
          )}
        </div>
      </div>

      {/* Children */}
      {isExpanded && (
        <div id={childGroupId} role="group" className="ml-4 md:ml-8">
          {/* Lesson plan row — always shown at top */}
          <LessonPlanRow hasLessonPlan={lesson.hasLessonPlan} onClick={onEditPlan} />

          {sortedActivities.length === 0 && (
            <p className="text-sm text-muted-foreground italic px-3 py-1.5 ml-8 md:ml-16">
              No activities in this lesson.
            </p>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedActivities.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedActivities.map((activity, i) => (
                <SortableActivityRow
                  key={activity.id}
                  activity={activity}
                  isFirst={i === 0}
                  isLast={i === sortedActivities.length - 1}
                  onDelete={() => onDeleteActivity(activity.id)}
                  onEdit={() => onEditActivity(activity.id)}
                  onMoveActivity={(dir) => handleMoveActivity(activity.id, dir)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Add activity button — disabled until lesson plan is set */}
          <div className="ml-8 md:ml-16 mt-1 mb-1">
            <AddItemButton
              label="Add activity"
              onClick={onAddActivity}
              disabled={!lesson.hasLessonPlan}
              ariaLabel={lesson.hasLessonPlan ? 'Add activity' : 'Set a lesson plan before adding activities'}
            />
          </div>

          {/* Lesson quiz */}
          <AssessmentRow
            assessment={lesson.assessment}
            label="Lesson quiz"
            level={3}
            indentClass="ml-8 md:ml-16"
          />
        </div>
      )}
    </div>
  );
}
