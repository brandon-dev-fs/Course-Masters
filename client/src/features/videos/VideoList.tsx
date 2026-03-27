import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { lessonResourcesApi } from '../../api/lesson-resources.js';
import type { LessonResource } from '../../api/types.js';
import { useAuth } from '../../context/AuthContext.js';
import useResourceList from '../../hooks/useResourceList.js';
import VideoCard from './VideoCard.js';
import VideoForm from './VideoForm.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';

type VideoCreateInput = { type: 'video'; title: string; content: { url: string }; order: number };
type VideoUpdateInput = { title?: string; content?: { url: string }; order?: number };

const byOrder = (a: LessonResource, b: LessonResource) => a.order - b.order;

export default function VideoList({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const canEdit = user?.role === 'teacher' || user?.role === 'admin';
  const [currentIndex, setCurrentIndex] = useState(0);
  const {
    items: videos, loading, error,
    showAdd, setShowAdd, editing, setEditing, deleting, setDeleting,
    handleAdd, handleUpdate, handleDelete,
  } = useResourceList<LessonResource, VideoCreateInput, VideoUpdateInput>(
    () => lessonResourcesApi.getAll(lessonId, 'video'),
    {
      create: d => lessonResourcesApi.create(lessonId, d),
      update: lessonResourcesApi.update,
      delete: lessonResourcesApi.delete,
    },
    lessonId, byOrder,
  );

  useEffect(() => {
    if (currentIndex >= videos.length && videos.length > 0) {
      setCurrentIndex(videos.length - 1);
    }
  }, [videos.length, currentIndex]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const current = videos[currentIndex];

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Video</Button>
        </div>
      )}

      {videos.length === 0 ? (
        <EmptyState
          title="No videos yet"
          description={canEdit ? 'Add video lectures for this lesson.' : 'No video lectures have been added to this lesson yet.'}
          action={canEdit ? { label: '+ Add Video', onClick: () => setShowAdd(true) } : undefined}
        />
      ) : (
        <div>
          <VideoCard
            video={current}
            onEdit={canEdit ? () => setEditing(current) : undefined}
            onDelete={canEdit ? () => setDeleting(current) : undefined}
          />

          {videos.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-3">
              <button
                onClick={() => setCurrentIndex(i => i - 1)}
                disabled={currentIndex === 0}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous video"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {videos.length}
              </span>
              <button
                onClick={() => setCurrentIndex(i => i + 1)}
                disabled={currentIndex === videos.length - 1}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next video"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <Modal title="Add Video" onClose={() => setShowAdd(false)}>
          <VideoForm
            nextOrder={videos.length + 1}
            onSubmit={async ({ title, url, order }) =>
              handleAdd({ type: 'video', title, content: { url }, order })
            }
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Video" onClose={() => setEditing(null)}>
          <VideoForm
            initial={editing}
            onSubmit={async ({ title, url, order }) =>
              handleUpdate({ title, content: { url }, order })
            }
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog title="Delete Video" message={`Delete "${deleting.title}"?`} onConfirm={handleDelete} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
