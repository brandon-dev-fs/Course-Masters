import { useState } from 'react';
import type { Lesson } from '../../api/types.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LessonForm from './LessonForm.js';

interface LessonSettingsModalProps {
  lesson: Lesson;
  onClose: () => void;
  onUpdate: (data: {
    title: string;
    description?: string;
    order: number;
    objective?: string;
    planContent?: Record<string, unknown>;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function LessonSettingsModal({ lesson, onClose, onUpdate, onDelete }: LessonSettingsModalProps) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <Modal title="Lesson Settings" onClose={onClose}>
      <div className="flex flex-col gap-6">
        {/* Lesson Info */}
        <LessonForm
          initial={lesson}
          onSubmit={onUpdate}
          onCancel={onClose}
        />

        {/* Danger Zone */}
        <div className="border-t border-border pt-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Danger Zone</p>
          {showDelete ? (
            <ConfirmDialog
              title="Delete Lesson"
              message={`Delete "${lesson.title}"? All content inside will also be deleted.`}
              onConfirm={onDelete}
              onClose={() => setShowDelete(false)}
            />
          ) : (
            <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
              Delete Lesson
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
