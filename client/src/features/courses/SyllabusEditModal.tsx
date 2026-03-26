import { useState } from 'react';
import type { Course } from '../../api/types.js';
import Modal from '../../components/Modal.js';
import Button from '../../components/Button.js';
import RichTextEditor from '../../components/RichTextEditor.js';

interface SyllabusEditModalProps {
  course: Course;
  onClose: () => void;
  onUpdateCourse: (data: { title: string; description?: string; syllabus?: Record<string, unknown> | null }) => Promise<void>;
}

export default function SyllabusEditModal({
  course,
  onClose,
  onUpdateCourse,
}: SyllabusEditModalProps) {
  const [syllabus, setSyllabus] = useState<Record<string, unknown> | null>(course.syllabus ?? null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdateCourse({ title: course.title, description: course.description, syllabus });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit Syllabus" onClose={onClose} size="lg">
      <div className="flex flex-col flex-1 min-h-0 gap-4">
        <RichTextEditor
          content={syllabus}
          onChange={setSyllabus}
          editable={true}
          className="flex-1 min-h-0"
        />
        <div className="flex justify-end gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Syllabus'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
