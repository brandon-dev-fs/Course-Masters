import RichTextEditor from '../../components/RichTextEditor.js';

interface NoteAssignmentViewProps {
  content: Record<string, unknown>;
}

export default function NoteAssignmentView({ content }: NoteAssignmentViewProps) {
  return (
    <RichTextEditor
      content={content}
      editable={false}
    />
  );
}
