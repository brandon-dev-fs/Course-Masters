import { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, BookOpen } from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor.js';

interface SyllabusSectionProps {
  syllabus: Record<string, unknown> | null | undefined;
  canEdit: boolean;
  onEditSyllabus: () => void;
}

export default function SyllabusSection({ syllabus, canEdit, onEditSyllabus }: SyllabusSectionProps) {
  const [open, setOpen] = useState(false);

  // Hide from students if no syllabus content
  if (!syllabus && !canEdit) return null;

  return (
    <div className="rounded-xl bg-surface border border-border mb-6 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-raised transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Syllabus</span>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <span
              role="button"
              onClick={e => { e.stopPropagation(); onEditSyllabus(); }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
              aria-label="Edit syllabus"
            >
              <Pencil className="w-3.5 h-3.5" />
            </span>
          )}
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Body */}
      <div
        className="grid transition-[grid-template-rows] duration-300"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="border-t border-border">
            {syllabus ? (
              <RichTextEditor content={syllabus} editable={false} />
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">No syllabus added yet.</p>
                <button
                  onClick={onEditSyllabus}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  + Add Syllabus
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
