import Modal from '../../components/Modal.js';
import Button from '../../components/Button.js';
import RichTextEditor from '../../components/RichTextEditor.js';

interface SyllabusViewModalProps {
  syllabus: Record<string, unknown>;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export default function SyllabusViewModal({ syllabus, canEdit, onClose, onEdit }: SyllabusViewModalProps) {
  return (
    <Modal title="Syllabus" onClose={onClose} size="xl">
      <div className="flex flex-col flex-1 min-h-0 gap-4">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <RichTextEditor content={syllabus} editable={false} />
        </div>
        {canEdit && (
          <div className="flex justify-end shrink-0">
            <Button size="sm" variant="secondary" onClick={onEdit}>
              Edit Syllabus
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
