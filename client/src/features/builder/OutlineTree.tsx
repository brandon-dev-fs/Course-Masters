import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

import type { BuilderUnit, BuilderLesson, BuilderActivity, BuilderAssessment, AssignmentType, ReorderItem } from '../../api/types.js';

import UnitRow from './UnitRow.js';
import AssessmentRow from './AssessmentRow.js';
import AddItemButton from './AddItemButton.js';
import { useDragReorder } from './hooks/useDragReorder.js';

interface SortableUnitRowProps {
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
  onAddLesson: () => Promise<void>;
  onAddActivity: (lessonId: string, type: AssignmentType) => Promise<void>;
  onReorderLessons: (reordered: BuilderLesson[], items: ReorderItem[]) => Promise<void>;
  onReorderActivities: (lessonId: string, reordered: BuilderActivity[], assignmentIds: string[]) => Promise<void>;
  onMoveUnit: (direction: 'up' | 'down') => void;
  onMoveLesson: (lessonId: string, direction: 'up' | 'down') => void;
  onMoveActivity: (lessonId: string, assignmentId: string, direction: 'up' | 'down') => void;
  announce: (message: string) => void;
}

function SortableUnitRow({
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
  onAddLesson,
  onAddActivity,
  onReorderLessons,
  onReorderActivities,
  onMoveUnit,
  onMoveLesson,
  onMoveActivity,
  announce,
}: SortableUnitRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: unit.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <UnitRow
        unit={unit}
        courseId={courseId}
        isExpanded={isExpanded}
        expandedLessons={expandedLessons}
        renamingId={renamingId}
        isFirst={isFirst}
        isLast={isLast}
        onToggle={onToggle}
        onToggleLesson={onToggleLesson}
        onRename={onRename}
        onRenameLesson={onRenameLesson}
        onStartRename={onStartRename}
        onCancelRename={onCancelRename}
        onDelete={onDelete}
        onDeleteLesson={onDeleteLesson}
        onDeleteActivity={onDeleteActivity}
        onAddLesson={onAddLesson}
        onAddActivity={onAddActivity}
        onReorderLessons={onReorderLessons}
        onReorderActivities={onReorderActivities}
        onMoveUnit={onMoveUnit}
        onMoveLesson={onMoveLesson}
        onMoveActivity={onMoveActivity}
        announce={announce}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

interface OutlineTreeProps {
  units: BuilderUnit[];
  courseAssessment: BuilderAssessment | null;
  courseId: string;
  expandedUnits: Set<string>;
  expandedLessons: Set<string>;
  renamingId: string | null;
  onToggleUnit: (unitId: string) => void;
  onToggleLesson: (lessonId: string) => void;
  onRenameUnit: (courseId: string, unitId: string, title: string) => Promise<void>;
  onRenameLesson: (unitId: string, lessonId: string, title: string) => Promise<void>;
  onStartRename: (id: string) => void;
  onCancelRename: () => void;
  onDeleteUnit: (unitId: string) => void;
  onDeleteLesson: (unitId: string, lessonId: string) => void;
  onDeleteActivity: (lessonId: string, assignmentId: string) => void;
  onAddUnit: () => Promise<void>;
  onAddLesson: (unitId: string) => Promise<void>;
  onAddActivity: (lessonId: string, type: AssignmentType) => Promise<void>;
  onReorderUnits: (reordered: BuilderUnit[], items: ReorderItem[]) => Promise<void>;
  onReorderLessons: (unitId: string, reordered: BuilderLesson[], items: ReorderItem[]) => Promise<void>;
  onReorderActivities: (lessonId: string, reordered: BuilderActivity[], assignmentIds: string[]) => Promise<void>;
  onMoveUnit: (unitId: string, direction: 'up' | 'down') => void;
  onMoveLesson: (unitId: string, lessonId: string, direction: 'up' | 'down') => void;
  onMoveActivity: (lessonId: string, assignmentId: string, direction: 'up' | 'down') => void;
  announce: (message: string) => void;
  addingUnit: boolean;
  onConfirmDeleteUnit: (unitId: string) => void;
  onConfirmDeleteLesson: (unitId: string, lessonId: string) => void;
  onConfirmDeleteActivity: (lessonId: string, assignmentId: string) => void;
}

export default function OutlineTree({
  units,
  courseAssessment,
  courseId,
  expandedUnits,
  expandedLessons,
  renamingId,
  onToggleUnit,
  onToggleLesson,
  onRenameUnit,
  onRenameLesson,
  onStartRename,
  onCancelRename,
  onDeleteUnit,
  onDeleteLesson,
  onDeleteActivity,
  onAddUnit,
  onAddLesson,
  onAddActivity,
  onReorderUnits,
  onReorderLessons,
  onReorderActivities,
  onMoveUnit,
  onMoveLesson,
  onMoveActivity,
  announce,
  addingUnit,
  onConfirmDeleteUnit,
  onConfirmDeleteLesson,
  onConfirmDeleteActivity,
}: OutlineTreeProps) {
  const sortedUnits = [...units].sort((a, b) => a.order - b.order);

  const { sensors, handleDragEnd } = useDragReorder({
    items: sortedUnits,
    onReorder: async (reordered, items) => {
      await onReorderUnits(reordered, items);
    },
    onRollback: () => {
      announce('Reorder failed. Order restored.');
    },
    announce,
    getItemLabel: (u) => u.title,
  });

  return (
    <div role="tree" aria-label="Course outline">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedUnits.map((u) => u.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedUnits.map((unit, i) => (
            <SortableUnitRow
              key={unit.id}
              unit={unit}
              courseId={courseId}
              isExpanded={expandedUnits.has(unit.id)}
              expandedLessons={expandedLessons}
              renamingId={renamingId}
              isFirst={i === 0}
              isLast={i === sortedUnits.length - 1}
              onToggle={() => onToggleUnit(unit.id)}
              onToggleLesson={onToggleLesson}
              onRename={onRenameUnit}
              onRenameLesson={onRenameLesson}
              onStartRename={onStartRename}
              onCancelRename={onCancelRename}
              onDelete={() => onConfirmDeleteUnit(unit.id)}
              onDeleteLesson={(lessonId) => onConfirmDeleteLesson(unit.id, lessonId)}
              onDeleteActivity={onConfirmDeleteActivity}
              onAddLesson={() => onAddLesson(unit.id)}
              onAddActivity={onAddActivity}
              onReorderLessons={(reordered, items) => onReorderLessons(unit.id, reordered, items)}
              onReorderActivities={onReorderActivities}
              onMoveUnit={(dir) => onMoveUnit(unit.id, dir)}
              onMoveLesson={(lessonId, dir) => onMoveLesson(unit.id, lessonId, dir)}
              onMoveActivity={onMoveActivity}
              announce={announce}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add unit button */}
      <div className="mt-2">
        <AddItemButton
          label="Add unit"
          loading={addingUnit}
          onClick={onAddUnit}
        />
      </div>

      {/* Course exam */}
      <div className="mt-2">
        <AssessmentRow
          assessment={courseAssessment}
          label="Course exam"
          level={1}
          indentClass="ml-0"
        />
      </div>
    </div>
  );
}
