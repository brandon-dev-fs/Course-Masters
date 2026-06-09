import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssignmentSection from '../../../features/lessons/AssignmentSection.js';
import type { AssignmentItem } from '../../../features/lessons/AssignmentSection.js';

const baseItem: AssignmentItem = {
  key: 'item-1',
  kind: 'resource',
  id: 'r1',
  title: 'Video: Intro',
  isRequired: false,
  order: 1,
  resourceType: 'video',
};

const defaultProps = {
  item: baseItem,
  isComplete: false,
  isLocked: false,
  canEdit: false,
  isFirst: false,
  isLast: false,
  incompleteRequired: [],
  onToggleCompletion: vi.fn(),
  onToggleRequired: vi.fn(),
  onPrev: vi.fn(),
  onNext: vi.fn(),
  children: <div>Content here</div>,
};

describe('AssignmentSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders item title', () => {
    render(<AssignmentSection {...defaultProps} />);
    expect(screen.getByText('Video: Intro')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<AssignmentSection {...defaultProps} />);
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('shows Mark complete button when not complete', () => {
    render(<AssignmentSection {...defaultProps} />);
    expect(screen.getByText('Mark complete')).toBeInTheDocument();
  });

  it('shows Completed when isComplete is true', () => {
    render(<AssignmentSection {...defaultProps} isComplete={true} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('calls onToggleCompletion when mark complete is clicked', () => {
    render(<AssignmentSection {...defaultProps} />);
    fireEvent.click(screen.getByText('Mark complete'));
    expect(defaultProps.onToggleCompletion).toHaveBeenCalledOnce();
  });

  it('shows Next button when not last', () => {
    render(<AssignmentSection {...defaultProps} isLast={false} />);
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('shows Back button when not first', () => {
    render(<AssignmentSection {...defaultProps} isFirst={false} />);
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('does not show Back button when first', () => {
    render(<AssignmentSection {...defaultProps} isFirst={true} />);
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });

  it('does not show Next button when last', () => {
    render(<AssignmentSection {...defaultProps} isLast={true} />);
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('calls onNext when Next is clicked', () => {
    render(<AssignmentSection {...defaultProps} isLast={false} />);
    fireEvent.click(screen.getByText('Next'));
    expect(defaultProps.onNext).toHaveBeenCalledOnce();
  });

  it('calls onPrev when Back is clicked', () => {
    render(<AssignmentSection {...defaultProps} isFirst={false} />);
    fireEvent.click(screen.getByText('Back'));
    expect(defaultProps.onPrev).toHaveBeenCalledOnce();
  });

  it('shows locked content when isLocked is true', () => {
    render(<AssignmentSection {...defaultProps} isLocked={true} />);
    expect(screen.getByText(/complete required assignments/i)).toBeInTheDocument();
  });

  it('does not show children when locked', () => {
    render(<AssignmentSection {...defaultProps} isLocked={true} />);
    expect(screen.queryByText('Content here')).not.toBeInTheDocument();
  });

  it('shows incomplete required items when locked', () => {
    const incomplete: AssignmentItem[] = [
      { key: 'r2', kind: 'resource', id: 'r2', title: 'Required Video', isRequired: true, order: 1 },
    ];
    render(<AssignmentSection {...defaultProps} isLocked={true} incompleteRequired={incomplete} />);
    expect(screen.getByText('Required Video')).toBeInTheDocument();
  });

  it('shows edit and delete buttons when canEdit', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <AssignmentSection
        {...defaultProps}
        canEdit={true}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    expect(screen.getByLabelText(/edit video: intro/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/delete video: intro/i)).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<AssignmentSection {...defaultProps} canEdit={true} onEdit={onEdit} />);
    fireEvent.click(screen.getByLabelText(/edit video: intro/i));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<AssignmentSection {...defaultProps} canEdit={true} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText(/delete video: intro/i));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('shows Required badge when item is required and not canEdit', () => {
    render(<AssignmentSection {...defaultProps} item={{ ...baseItem, isRequired: true }} />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('shows Optional badge when item is optional and not canEdit', () => {
    render(<AssignmentSection {...defaultProps} item={{ ...baseItem, isRequired: false }} />);
    expect(screen.getByText('Optional')).toBeInTheDocument();
  });

  it('shows toggle required button when canEdit', () => {
    render(<AssignmentSection {...defaultProps} canEdit={true} item={{ ...baseItem, isRequired: false }} />);
    expect(screen.getByTitle('Mark required')).toBeInTheDocument();
  });

  it('does not show completion footer for quiz items', () => {
    const quizItem: AssignmentItem = { ...baseItem, kind: 'quiz', key: 'quiz', id: null, title: 'Quiz', isRequired: true };
    render(<AssignmentSection {...defaultProps} item={quizItem} />);
    expect(screen.queryByText('Mark complete')).not.toBeInTheDocument();
  });
});
