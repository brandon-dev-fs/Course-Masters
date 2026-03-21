import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { studentNotesApi } from '../../api/student-notes.js';
import type { StudentNote } from '../../api/types.js';

interface StudentNotePanelProps {
  lessonId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentNotePanel({ lessonId, isOpen, onClose }: StudentNotePanelProps) {
  const [note, setNote] = useState<StudentNote | null>(null);
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || loadedRef.current) return;
    loadedRef.current = true;
    studentNotesApi.get(lessonId).then(existing => {
      if (existing) {
        setNote(existing);
        setContent(existing.content);
      }
    }).catch(() => {});
  }, [isOpen, lessonId]);

  // Reset when lessonId changes
  useEffect(() => {
    loadedRef.current = false;
    setNote(null);
    setContent('');
    setSaveStatus('idle');
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
    <div
      className={`shrink-0 border-l border-border bg-surface flex flex-col overflow-hidden transition-all duration-300 ${
        isOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground">My Notes</h2>
        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && <span className="text-xs text-muted-foreground">Saving…</span>}
          {saveStatus === 'saved' && <span className="text-xs text-primary">Saved</span>}
          {note && saveStatus === 'idle' && (
            <button onClick={handleDelete} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={e => handleChange(e.target.value)}
        placeholder="Write your personal notes here... They save automatically."
        className="flex-1 resize-none bg-surface p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  );
}
