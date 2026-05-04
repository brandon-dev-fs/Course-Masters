import RichTextEditor from '../../components/RichTextEditor.js';
import type { SubFormProps } from './AssignmentFormModal.js';

export default function NoteAssignmentForm({ noteContent, onNoteContentChange }: SubFormProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">
        Content<span aria-hidden="true"> *</span>
        <span className="sr-only"> (required)</span>
      </label>
      <RichTextEditor
        content={noteContent}
        onChange={onNoteContentChange}
        editable
      />
    </div>
  );
}
