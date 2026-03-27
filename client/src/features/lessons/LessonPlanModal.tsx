import { useState, useCallback, useRef } from 'react';
import type { Lesson } from '../../api/types.js';
import Modal from '../../components/Modal.js';
import Textarea from '../../components/Textarea.js';
import RichTextEditor from '../../components/RichTextEditor.js';
import Button from '../../components/Button.js';

interface LessonPlanModalProps {
  lesson: Lesson;
  onClose: () => void;
  onUpdate: (data: {
    title: string;
    description?: string;
    order: number;
    objective?: string;
    planContent?: Record<string, unknown>;
  }) => Promise<void>;
}

export default function LessonPlanModal({ lesson, onClose, onUpdate }: LessonPlanModalProps) {
  const [objective, setObjective] = useState(lesson.objective ?? '');
  const [saving, setSaving] = useState(false);
  const planContent = useRef<Record<string, unknown> | null>(lesson.planContent ?? null);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onUpdate({
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        objective: objective.trim() || undefined,
        planContent: planContent.current ?? undefined,
      });
    } finally {
      setSaving(false);
    }
  }, [lesson, objective, onUpdate]);

  return (
    <Modal title="Edit Lesson Plan" onClose={onClose} size="lg">
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
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Plan'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
