import { useState } from 'react';
import type { Course } from '../../api/types.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import CourseForm from './CourseForm.js';
import RichTextEditor from '../../components/RichTextEditor.js';

interface CourseSettingsModalProps {
  course: Course;
  onClose: () => void;
  onUpdateCourse: (data: { title: string; description?: string; syllabus?: Record<string, unknown> | null }) => Promise<void>;
  onDeleteCourse: () => Promise<void>;
}

export default function CourseSettingsModal({
  course,
  onClose,
  onUpdateCourse,
  onDeleteCourse,
}: CourseSettingsModalProps) {
  const [showDeleteCourse, setShowDeleteCourse] = useState(false);
  const [syllabus, setSyllabus] = useState<Record<string, unknown> | null>(course.syllabus ?? null);
  const [savingSyllabus, setSavingSyllabus] = useState(false);

  async function handleSaveSyllabus() {
    setSavingSyllabus(true);
    try {
      await onUpdateCourse({ title: course.title, description: course.description, syllabus });
    } finally {
      setSavingSyllabus(false);
    }
  }

  return (
    <Modal title="Course Settings" onClose={onClose} size="lg">
      <div className="flex flex-col gap-6">
        {/* Course Info */}
        <div>
          <CourseForm
            initial={course}
            onSubmit={async (data) => onUpdateCourse(data)}
            onCancel={onClose}
          />
        </div>

        {/* Syllabus */}
        <div className="border-t border-border pt-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Syllabus</h3>
          </div>
          <RichTextEditor
            content={syllabus}
            onChange={setSyllabus}
            editable={true}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveSyllabus} disabled={savingSyllabus}>
              {savingSyllabus ? 'Saving...' : 'Save Syllabus'}
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-border pt-5">
          {showDeleteCourse ? (
            <ConfirmDialog
              title="Delete Course"
              message={`Delete "${course.title}"? This will also delete all units and lessons.`}
              onConfirm={onDeleteCourse}
              onClose={() => setShowDeleteCourse(false)}
            />
          ) : (
            <Button variant="danger" size="sm" onClick={() => setShowDeleteCourse(true)}>
              Delete Course
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
