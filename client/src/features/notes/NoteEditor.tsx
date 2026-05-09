import { useState, useEffect, useCallback, useRef } from 'react';
import { lessonResourcesApi } from '../../api/lesson-resources.js';
import type { LessonResource } from '../../api/types.js';
import useCanEdit from '../../hooks/useCanEdit.js';
import RichTextEditor from '../../components/RichTextEditor.js';
import ResourceCompletionCheckbox from '../../components/ResourceCompletionCheckbox.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import { Pencil, Save, X } from 'lucide-react';

interface NoteEditorProps {
  note: LessonResource;
  isComplete?: boolean;
  onToggleComplete?: () => void;
  onUpdate?: (note: LessonResource) => void;
  initialEditing?: boolean;
}

export default function NoteEditor({ note, isComplete, onToggleComplete, onUpdate, initialEditing }: NoteEditorProps) {
  const canEdit = useCanEdit();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedBody, setSavedBody] = useState<Record<string, unknown>>(
    (note.content.body as Record<string, unknown>) ?? { type: 'doc', content: [] },
  );
  const [editingTitle, setEditingTitle] = useState(note.title);
  const [editing, setEditing] = useState(initialEditing ?? false);
  const pendingBody = useRef<Record<string, unknown>>(savedBody);

  useEffect(() => {
    const body = (note.content.body as Record<string, unknown>) ?? { type: 'doc', content: [] };
    setSavedBody(body);
    pendingBody.current = body;
    setEditingTitle(note.title);
    setEditing(false);
  }, [note.id]);

  const handleChange = useCallback((content: Record<string, unknown>) => {
    pendingBody.current = content;
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await lessonResourcesApi.update(note.id, {
        title: editingTitle.trim() || 'Untitled',
        content: { body: pendingBody.current },
      });
      setSavedBody((updated.content.body as Record<string, unknown>) ?? { type: 'doc', content: [] });
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
    pendingBody.current = savedBody;
    setEditingTitle(note.title);
    setEditing(false);
    setError(null);
  }, [savedBody, note.title]);

  return (
    <div className="flex flex-col gap-3">
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
        content={savedBody}
        onChange={handleChange}
        editable={editing}
      />
      {onToggleComplete !== undefined && (
        <div className="pt-2 border-t border-border">
          <ResourceCompletionCheckbox isComplete={isComplete ?? false} onToggle={onToggleComplete} />
        </div>
      )}
    </div>
  );
}
