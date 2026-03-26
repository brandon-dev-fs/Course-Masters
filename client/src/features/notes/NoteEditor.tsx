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
  onUpdate?: (note: Note) => void;
  initialEditing?: boolean;
}

export default function NoteEditor({ note, isComplete, onToggleComplete, onUpdate, initialEditing }: NoteEditorProps) {
  const { user } = useAuth();
  const canEdit = user?.role === 'teacher' || user?.role === 'admin';

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedContent, setSavedContent] = useState<Record<string, unknown>>(note.content);
  const [editingTitle, setEditingTitle] = useState(note.title);
  const [editing, setEditing] = useState(initialEditing ?? false);
  const pendingContent = useRef<Record<string, unknown>>(note.content);

  useEffect(() => {
    setSavedContent(note.content);
    pendingContent.current = note.content;
    setEditingTitle(note.title);
    setEditing(false);
  }, [note.id]);

  const handleChange = useCallback((content: Record<string, unknown>) => {
    pendingContent.current = content;
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await notesApi.update(note.id, { title: editingTitle.trim() || 'Untitled', content: pendingContent.current });
      setSavedContent(updated.content);
      setEditingTitle(updated.title);
      setEditing(false);
      onUpdate?.(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [note.id, editingTitle, onUpdate]);

  const handleCancel = useCallback(() => {
    pendingContent.current = savedContent;
    setEditingTitle(note.title);
    setEditing(false);
    setError(null);
  }, [savedContent, note.title]);

  return (
    <div className="flex flex-col gap-3">
      {/* Note title */}
      {editing ? (
        <input
          type="text"
          value={editingTitle}
          onChange={e => setEditingTitle(e.target.value)}
          placeholder="Note title"
          className="text-xl font-bold bg-transparent border-b border-primary outline-none text-foreground placeholder:text-muted-foreground pb-1"
        />
      ) : (
        <h2 className="text-xl font-bold text-foreground">{note.title}</h2>
      )}

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
