const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../api/client.js', () => ({ apiClient: apiClientMock }));

vi.mock('../../../components/RichTextEditor.js', () => ({
  default: () => <div data-testid="rich-text-editor" />,
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LessonResourceContent from '../../../features/lessons/LessonResourceContent.js';
import type { LessonResource, NoteResource, VideoResource } from '../../../api/types.js';

const videoResource: VideoResource = {
  id: 'r1',
  lessonId: 'l1',
  type: 'video',
  title: 'Intro Video',
  order: 1,
  isRequired: false,
  content: { url: 'https://www.youtube.com/watch?v=test123' },
};

const noteResource: NoteResource = {
  id: 'r2',
  lessonId: 'l1',
  type: 'note',
  title: 'Study Note',
  order: 2,
  isRequired: false,
  content: { body: { type: 'doc', content: [] } },
};

const lectureResource: LessonResource = {
  ...noteResource,
  id: 'r3',
  type: 'lecture',
  title: 'Lecture Notes',
};

const defaultProps = {
  canEdit: false,
  editingVideoId: null,
  newNoteIdRef: React.createRef<string | null>(),
  onVideoEditStart: vi.fn(),
  onVideoEditCancel: vi.fn(),
  onVideoUpdated: vi.fn(),
  onVideoDeleted: vi.fn(),
  onNoteUpdated: vi.fn(),
};

describe('LessonResourceContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders video card for video resource', () => {
    render(
      <MemoryRouter>
        <LessonResourceContent resource={videoResource} {...defaultProps} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Intro Video')).toBeInTheDocument();
  });

  it('renders video form when editingVideoId matches', () => {
    render(
      <MemoryRouter>
        <LessonResourceContent
          resource={videoResource}
          {...defaultProps}
          editingVideoId="r1"
          canEdit={true}
        />
      </MemoryRouter>,
    );
    // VideoForm should show a title input with the video's title
    expect(screen.getByDisplayValue('Intro Video')).toBeInTheDocument();
  });

  it('renders note editor for note resource', () => {
    render(
      <MemoryRouter>
        <LessonResourceContent resource={noteResource} {...defaultProps} />
      </MemoryRouter>,
    );
    // NoteEditor uses RichTextEditor
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('renders note editor for lecture resource', () => {
    render(
      <MemoryRouter>
        <LessonResourceContent resource={lectureResource} {...defaultProps} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('renders null for unknown resource type', () => {
    const unknownResource = { ...noteResource, type: 'unknown' as unknown as 'note' };
    const { container } = render(
      <MemoryRouter>
        <LessonResourceContent resource={unknownResource} {...defaultProps} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows Edit and Delete buttons when canEdit is true', () => {
    render(
      <MemoryRouter>
        <LessonResourceContent resource={videoResource} {...defaultProps} canEdit={true} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('calls onVideoEditStart when Edit is clicked', () => {
    const onVideoEditStart = vi.fn();
    render(
      <MemoryRouter>
        <LessonResourceContent
          resource={videoResource}
          {...defaultProps}
          canEdit={true}
          onVideoEditStart={onVideoEditStart}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onVideoEditStart).toHaveBeenCalledWith('r1');
  });

  it('calls onVideoDeleted when Delete is clicked', async () => {
    apiClientMock.delete.mockResolvedValueOnce(undefined);
    const onVideoDeleted = vi.fn();
    render(
      <MemoryRouter>
        <LessonResourceContent
          resource={videoResource}
          {...defaultProps}
          canEdit={true}
          onVideoDeleted={onVideoDeleted}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => expect(onVideoDeleted).toHaveBeenCalledWith('r1'));
  });
});
