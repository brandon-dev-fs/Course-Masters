const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../api/client.js', () => ({ apiClient: apiClientMock }));

vi.mock('../../../components/RichTextEditor.js', () => ({
  default: () => <div data-testid="rich-text-editor" />,
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LessonResourceContent from '../../../features/lessons/LessonResourceContent.js';
import type { LessonResource } from '../../../api/types.js';

const videoResource: LessonResource = {
  id: 'r1',
  lessonId: 'l1',
  type: 'video',
  title: 'Intro Video',
  order: 1,
  isRequired: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  content: { url: 'https://www.youtube.com/watch?v=test123' },
};

const noteResource: LessonResource = {
  id: 'r2',
  lessonId: 'l1',
  type: 'note',
  title: 'Study Note',
  order: 2,
  isRequired: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
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
    const unknownResource = { ...noteResource, type: 'unknown' as 'note' };
    const { container } = render(
      <MemoryRouter>
        <LessonResourceContent resource={unknownResource} {...defaultProps} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });
});
