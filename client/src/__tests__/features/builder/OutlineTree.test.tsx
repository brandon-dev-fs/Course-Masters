import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock @dnd-kit
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PointerSensor: class {},
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn((...sensors: unknown[]) => sensors),
  closestCenter: {},
}));
vi.mock('@dnd-kit/modifiers', () => ({ restrictToVerticalAxis: vi.fn() }));
vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}));

// Mock child components
vi.mock('../../../features/builder/UnitRow.js', () => ({
  default: ({ unit }: { unit: { title: string } }) => (
    <div data-testid="unit-row">{unit.title}</div>
  ),
}));
vi.mock('../../../features/builder/AssessmentRow.js', () => ({
  default: ({ label }: { label: string }) => (
    <div data-testid="assessment-row">{label}</div>
  ),
}));
vi.mock('../../../features/builder/AddItemButton.js', () => ({
  default: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ),
}));
vi.mock('../../../features/builder/hooks/useDragReorder.js', () => ({
  useDragReorder: () => ({
    sensors: [],
    handleDragEnd: vi.fn(),
  }),
}));

import OutlineTree from '../../../features/builder/OutlineTree.js';
import type { BuilderUnit } from '../../../api/types.js';

const makeUnit = (overrides?: Partial<BuilderUnit>): BuilderUnit => ({
  id: 'unit-1',
  title: 'Test Unit',
  description: 'A test unit',
  order: 1,
  lessons: [],
  assessment: null,
  ...overrides,
});

const defaultProps = {
  courseId: 'course-1',
  expandedUnits: new Set<string>(),
  expandedLessons: new Set<string>(),
  renamingId: null,
  onToggleUnit: vi.fn(),
  onToggleLesson: vi.fn(),
  onRenameUnit: vi.fn().mockResolvedValue(undefined),
  onRenameLesson: vi.fn().mockResolvedValue(undefined),
  onStartRename: vi.fn(),
  onCancelRename: vi.fn(),
  onDeleteUnit: vi.fn(),
  onDeleteLesson: vi.fn(),
  onDeleteActivity: vi.fn(),
  onAddUnit: vi.fn(),
  onAddLesson: vi.fn(),
  onAddActivity: vi.fn(),
  onReorderUnits: vi.fn().mockResolvedValue(undefined),
  onReorderLessons: vi.fn().mockResolvedValue(undefined),
  onReorderActivities: vi.fn().mockResolvedValue(undefined),
  onMoveUnit: vi.fn(),
  onMoveLesson: vi.fn(),
  onMoveActivity: vi.fn(),
  onEditUnit: vi.fn(),
  announce: vi.fn(),
  onConfirmDeleteUnit: vi.fn(),
  onConfirmDeleteLesson: vi.fn(),
  onConfirmDeleteActivity: vi.fn(),
};

describe('OutlineTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing with empty units', () => {
    render(
      <OutlineTree
        units={[]}
        courseAssessment={null}
        {...defaultProps}
      />,
    );
    expect(screen.getByRole('tree', { name: /course outline/i })).toBeInTheDocument();
  });

  it('renders unit rows when units are provided', () => {
    render(
      <OutlineTree
        units={[makeUnit()]}
        courseAssessment={null}
        {...defaultProps}
      />,
    );
    expect(screen.getByTestId('unit-row')).toBeInTheDocument();
    expect(screen.getByText('Test Unit')).toBeInTheDocument();
  });

  it('renders multiple unit rows', () => {
    const units = [
      makeUnit({ id: 'u1', title: 'Unit 1', order: 1 }),
      makeUnit({ id: 'u2', title: 'Unit 2', order: 2 }),
    ];
    render(
      <OutlineTree
        units={units}
        courseAssessment={null}
        {...defaultProps}
      />,
    );
    expect(screen.getAllByTestId('unit-row')).toHaveLength(2);
  });

  it('renders the Add unit button', () => {
    render(
      <OutlineTree
        units={[]}
        courseAssessment={null}
        {...defaultProps}
      />,
    );
    expect(screen.getByRole('button', { name: 'Add unit' })).toBeInTheDocument();
  });

  it('calls onAddUnit when Add unit button is clicked', () => {
    const onAddUnit = vi.fn();
    render(
      <OutlineTree
        units={[]}
        courseAssessment={null}
        {...defaultProps}
        onAddUnit={onAddUnit}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add unit' }));
    expect(onAddUnit).toHaveBeenCalledTimes(1);
  });

  it('renders the course exam assessment row', () => {
    render(
      <OutlineTree
        units={[]}
        courseAssessment={null}
        {...defaultProps}
      />,
    );
    expect(screen.getByTestId('assessment-row')).toBeInTheDocument();
    expect(screen.getByText('Course exam')).toBeInTheDocument();
  });

  it('renders units sorted by order', () => {
    const units = [
      makeUnit({ id: 'u2', title: 'Second Unit', order: 2 }),
      makeUnit({ id: 'u1', title: 'First Unit', order: 1 }),
    ];
    render(
      <OutlineTree
        units={units}
        courseAssessment={null}
        {...defaultProps}
      />,
    );
    const unitRows = screen.getAllByTestId('unit-row');
    expect(unitRows[0]).toHaveTextContent('First Unit');
    expect(unitRows[1]).toHaveTextContent('Second Unit');
  });

  it('renders with a course assessment', () => {
    render(
      <OutlineTree
        units={[]}
        courseAssessment={{ id: 'exam-1', type: 'course_exam', questionCount: 10 }}
        {...defaultProps}
      />,
    );
    expect(screen.getByTestId('assessment-row')).toBeInTheDocument();
  });
});
