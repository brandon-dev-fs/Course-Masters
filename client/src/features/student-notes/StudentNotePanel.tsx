import { useEffect, useRef, useState } from 'react';
import { NotebookPen, X } from 'lucide-react';
import { studentNotesApi } from '../../api/student-notes.js';
import type { StudentNote } from '../../api/types.js';

interface StudentNotePanelProps {
  lessonId: string;
  disabled?: boolean;
}

export default function StudentNotePanel({ lessonId, disabled = false }: StudentNotePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    setIsOpen(false);
  }, [lessonId]);

  // Close if disabled (e.g. quiz)
  useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

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

  if (disabled) return null;

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
      {/* Expanded drawer */}
      <div
        className={`flex flex-col w-80 rounded-xl bg-surface border border-border shadow-xl overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen ? 'max-h-[36rem] opacity-100 scale-100' : 'max-h-0 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-foreground">My Notes</h2>
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && <span className="text-xs text-muted-foreground">Saving…</span>}
            {saveStatus === 'saved' && <span className="text-xs text-primary">Saved</span>}
            {note && saveStatus === 'idle' && (
              <button onClick={handleDelete} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Clear</button>
            )}
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Close notes">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={content}
          onChange={e => handleChange(e.target.value)}
          placeholder="Write your personal notes here… They save automatically."
          className="flex-1 resize-none bg-surface p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-80"
        />
      </div>

      {/* FAB toggle button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${
          isOpen ? 'bg-primary/90 text-white' : 'bg-primary text-white hover:bg-primary/90'
        }`}
        aria-label="Toggle my notes"
        title="My Notes"
      >
        <NotebookPen className="w-5 h-5" />
      </button>
    </div>
  );
}
