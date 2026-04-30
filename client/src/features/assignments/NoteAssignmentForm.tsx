import RichTextEditor from '../../components/RichTextEditor.js';

interface NoteAssignmentFormProps {
  value: Record<string, unknown> | null;
  onChange: (content: Record<string, unknown>) => void;
}

export default function NoteAssignmentForm({ value, onChange }: NoteAssignmentFormProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">
        Content<span aria-hidden="true"> *</span>
        <span className="sr-only"> (required)</span>
      </label>
      <RichTextEditor
        content={value}
        onChange={onChange}
        editable
      />
    </div>
  );
}
