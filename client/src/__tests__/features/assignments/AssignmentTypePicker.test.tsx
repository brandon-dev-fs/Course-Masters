import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileText, Video } from 'lucide-react';
import AssignmentTypePicker from '../../../features/assignments/AssignmentTypePicker.js';
import type { AssignmentType } from '../../../api/types.js';

const mockConfig = {
  note: { label: 'Note', icon: FileText },
  video: { label: 'Video', icon: Video },
} as const;

describe('AssignmentTypePicker', () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<AssignmentTypePicker config={mockConfig as any} onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: /note/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /video/i })).toBeInTheDocument();
  });

  it('calls onSelect with correct type when a type is clicked', () => {
    render(<AssignmentTypePicker config={mockConfig as any} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /add note assignment/i }));
    expect(onSelect).toHaveBeenCalledWith('note');
  });

  it('calls onSelect with video type', () => {
    render(<AssignmentTypePicker config={mockConfig as any} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /add video assignment/i }));
    expect(onSelect).toHaveBeenCalledWith('video');
  });
});
