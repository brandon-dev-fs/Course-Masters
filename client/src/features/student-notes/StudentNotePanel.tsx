import { useEffect, useRef, useState } from 'react';
import { studentNotesApi } from '../../api/student-notes.js';
import type { StudentNote } from '../../api/types.js';

interface StudentNotePanelProps {
  lessonId: string;
}

export default function StudentNotePanel({ lessonId }: StudentNotePanelProps) {
  const [note, setNote] = useState<StudentNote | null>(null);
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    studentNotesApi.get(lessonId).then(existing => {
      if (existing) {
        setNote(existing);
        setContent(existing.content);
      }
    }).catch(() => {});
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [lessonId]);

  function handleChange(value: string) {
    setContent(value);
    setSaveStatus('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const saved = await studentNotesApi.upsert(lessonId, { content: value });
        setNote(saved);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('idle');
      }
    }, 1000);
  }

  async function handleDelete() {
    if (!note) return;
    await studentNotesApi.delete(note.id);
    setNote(null);
    setContent('');
    setSaveStatus('idle');
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <span className="text-xs font-semibold text-foreground">My Notes</span>
        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && <span className="text-xs text-muted-foreground">Saving…</span>}
          {saveStatus === 'saved' && <span className="text-xs text-primary">Saved</span>}
          {note && saveStatus === 'idle' && (
            <button onClick={handleDelete} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>
      <textarea
        value={content}
        onChange={e => handleChange(e.target.value)}
        placeholder="Write your personal notes here… They save automatically."
        className="flex-1 resize-none bg-surface p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-48"
      />
    </div>
  );
}
