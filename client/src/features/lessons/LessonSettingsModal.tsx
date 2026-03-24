import { useState, useCallback, useRef } from 'react';
import type { Lesson } from '../../api/types.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LessonForm from './LessonForm.js';
import Textarea from '../../components/Textarea.js';
import RichTextEditor from '../../components/RichTextEditor.js';

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
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [objective, setObjective] = useState(lesson.objective ?? '');
  const [savingPlan, setSavingPlan] = useState(false);
  const planContent = useRef<Record<string, unknown> | null>(lesson.planContent ?? null);

  const handlePlanSave = useCallback(async () => {
    setSavingPlan(true);
    try {
      await onUpdate({
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        objective: objective.trim() || undefined,
        planContent: planContent.current ?? undefined,
      });
    } finally {
      setSavingPlan(false);
    }
  }, [lesson, objective, onUpdate]);

  return (
    <Modal title="Lesson Settings" onClose={onClose} size={showPlanEditor ? 'lg' : 'md'}>
      <div className="flex flex-col gap-6">
        {/* Lesson Info */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Lesson Info</p>
          <LessonForm
            initial={lesson}
            onSubmit={onUpdate}
            onCancel={onClose}
          />
        </div>

        {/* Lesson Plan */}
        <div className="border-t border-border pt-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Lesson Plan</p>
          {showPlanEditor ? (
            <div className="flex flex-col gap-4">
              <Textarea
                id="objective"
                label="Learning Objective"
                value={objective}
                onChange={e => setObjective(e.target.value)}
                placeholder="What will students learn from this lesson?"
                rows={2}
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Plan Content</label>
                <RichTextEditor
                  content={planContent.current}
                  onChange={(c) => { planContent.current = c; }}
                  editable
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowPlanEditor(false)} disabled={savingPlan}>
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={handlePlanSave} disabled={savingPlan}>
                  {savingPlan ? 'Saving...' : 'Save Plan'}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setShowPlanEditor(true)}>
              {lesson.objective || lesson.planContent ? 'Edit Lesson Plan' : 'Add Lesson Plan'}
            </Button>
          )}
        </div>

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
