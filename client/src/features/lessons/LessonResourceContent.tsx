import type React from 'react';
import { lessonResourcesApi } from '../../api/lesson-resources.js';
import type { LessonResource } from '../../api/types.js';
import VideoCard from '../videos/VideoCard.js';
import VideoForm from '../videos/VideoForm.js';
import NoteEditor from '../notes/NoteEditor.js';

interface LessonResourceContentProps {
  resource: LessonResource;
  canEdit: boolean;
  editingVideoId: string | null;
  newNoteIdRef: React.RefObject<string | null>;
  onVideoEditStart: (id: string) => void;
  onVideoEditCancel: () => void;
  onVideoUpdated: (updated: LessonResource) => void;
  onVideoDeleted: (id: string) => void;
  onNoteUpdated: (updated: LessonResource) => void;
}

export default function LessonResourceContent({
  resource,
  canEdit,
  editingVideoId,
  newNoteIdRef,
  onVideoEditStart,
  onVideoEditCancel,
  onVideoUpdated,
  onVideoDeleted,
  onNoteUpdated,
}: LessonResourceContentProps) {
  if (resource.type === 'video') {
    if (editingVideoId === resource.id) {
      return (
        <VideoForm
          initial={resource}
          onSubmit={async ({ title, url, order }) => {
            const updated = await lessonResourcesApi.update(resource.id, { title, content: { url }, order });
            onVideoUpdated(updated);
          }}
          onCancel={onVideoEditCancel}
        />
      );
    }
    return (
      <VideoCard
        video={resource}
        onEdit={canEdit ? () => onVideoEditStart(resource.id) : undefined}
        onDelete={canEdit ? async () => {
          await lessonResourcesApi.delete(resource.id);
          onVideoDeleted(resource.id);
        } : undefined}
      />
    );
  }

  if (resource.type === 'note' || resource.type === 'lecture') {
    const isNew = newNoteIdRef.current === resource.id;
    if (isNew) newNoteIdRef.current = null;
    return (
      <NoteEditor
        key={resource.id}
        note={resource}
        onUpdate={onNoteUpdated}
        initialEditing={isNew}
      />
    );
  }

  return null;
}
