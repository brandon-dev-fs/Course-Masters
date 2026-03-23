import { useState, useEffect, useCallback, useRef } from 'react';
import { notesApi } from '../../api/notes.js';
import { useAuth } from '../../context/AuthContext.js';
import RichTextEditor from '../../components/RichTextEditor.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';
import { Pencil, Save, X } from 'lucide-react';

export default function NoteEditor({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const canEdit = user?.role === 'teacher' || user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedContent, setSavedContent] = useState<Record<string, unknown> | null>(null);
  const [hasNote, setHasNote] = useState(false);
  const [editing, setEditing] = useState(false);
  const pendingContent = useRef<Record<string, unknown> | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    notesApi.get(lessonId)
      .then(note => {
        if (note) {
          setSavedContent(note.content);
          pendingContent.current = note.content;
          setHasNote(true);
        } else {
          setSavedContent(null);
          pendingContent.current = null;
          setHasNote(false);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleChange = useCallback((content: Record<string, unknown>) => {
    pendingContent.current = content;
  }, []);

  const handleSave = useCallback(async () => {
    if (!pendingContent.current) return;
    setSaving(true);
    setError(null);
    try {
      const note = await notesApi.upsert(lessonId, pendingContent.current);
      setSavedContent(note.content);
      setHasNote(true);
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [lessonId]);

  const handleCancel = useCallback(() => {
    pendingContent.current = savedContent;
    setEditing(false);
    setError(null);
  }, [savedContent]);

  const handleStartWriting = useCallback(() => {
    const emptyDoc = { type: 'doc', content: [{ type: 'paragraph' }] };
    setSavedContent(emptyDoc);
    pendingContent.current = emptyDoc;
    setHasNote(true);
    setEditing(true);
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error && !hasNote) return <ErrorMessage message={error} />;

  if (!hasNote && !canEdit) {
    return <EmptyState title="No lecture notes" description="No lecture notes have been added to this lesson yet." />;
  }

  if (!hasNote && canEdit) {
    return (
      <EmptyState
        title="No lecture notes"
        description="Start writing lecture notes for this lesson."
        action={{ label: '+ Start Writing', onClick: handleStartWriting }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {canEdit && (
        <div className="flex justify-end gap-2">
          {editing ? (
            <>
              <Button variant="secondary" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      )}
      {error && <ErrorMessage message={error} />}
      <RichTextEditor
        content={savedContent}
        onChange={handleChange}
        editable={editing}
      />
    </div>
  );
}
