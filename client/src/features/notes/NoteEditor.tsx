import { useState, useEffect, useCallback, useRef } from 'react';
import { notesApi } from '../../api/notes.js';
import type { Note } from '../../api/types.js';
import { useAuth } from '../../context/AuthContext.js';
import RichTextEditor from '../../components/RichTextEditor.js';
import ResourceCompletionCheckbox from '../../components/ResourceCompletionCheckbox.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import { Pencil, Save, X } from 'lucide-react';

interface NoteEditorProps {
  note: Note;
  isComplete: boolean;
  onToggleComplete: () => void;
}

export default function NoteEditor({ note, isComplete, onToggleComplete }: NoteEditorProps) {
  const { user } = useAuth();
  const canEdit = user?.role === 'teacher' || user?.role === 'admin';

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedContent, setSavedContent] = useState<Record<string, unknown>>(note.content);
  const [editing, setEditing] = useState(false);
  const pendingContent = useRef<Record<string, unknown>>(note.content);

  useEffect(() => {
    setSavedContent(note.content);
    pendingContent.current = note.content;
    setEditing(false);
  }, [note.id]);

  const handleChange = useCallback((content: Record<string, unknown>) => {
    pendingContent.current = content;
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await notesApi.update(note.id, { content: pendingContent.current });
      setSavedContent(updated.content);
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [note.id]);

  const handleCancel = useCallback(() => {
    pendingContent.current = savedContent;
    setEditing(false);
    setError(null);
  }, [savedContent]);

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
      <div className="pt-2 border-t border-border">
        <ResourceCompletionCheckbox isComplete={isComplete} onToggle={onToggleComplete} />
      </div>
    </div>
  );
}
