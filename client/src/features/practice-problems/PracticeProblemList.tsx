import { practiceProblemsApi } from '../../api/practice-problems.js';
import type { PracticeProblem } from '../../api/types.js';
import useResourceList from '../../hooks/useResourceList.js';
import PracticeProblemCard from './PracticeProblemCard.js';
import PracticeProblemForm from './PracticeProblemForm.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';

const byOrder = (a: PracticeProblem, b: PracticeProblem) => a.order - b.order;

export default function PracticeProblemList({ lessonId }: { lessonId: string }) {
  const {
    items: problems, loading, error,
    showAdd, setShowAdd, editing, setEditing, deleting, setDeleting,
    handleAdd, handleUpdate, handleDelete,
  } = useResourceList<PracticeProblem, { question: string; options: string[]; correctIndex: number; order: number }, { question?: string; options?: string[]; correctIndex?: number; order?: number }>(
    () => practiceProblemsApi.getAll(lessonId),
    { create: d => practiceProblemsApi.create(lessonId, d), update: practiceProblemsApi.update, delete: practiceProblemsApi.delete },
    lessonId, byOrder,
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Problem</Button>
      </div>

      {problems.length === 0 ? (
        <EmptyState title="No practice problems yet" description="Add problems to test your understanding." action={{ label: '+ Add Problem', onClick: () => setShowAdd(true) }} />
      ) : (
        <div className="flex flex-col gap-3">
          {problems.map(prob => (
            <PracticeProblemCard key={prob.id} problem={prob} onEdit={() => setEditing(prob)} onDelete={() => setDeleting(prob)} />
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add Practice Problem" onClose={() => setShowAdd(false)}>
          <PracticeProblemForm nextOrder={problems.length + 1} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Practice Problem" onClose={() => setEditing(null)}>
          <PracticeProblemForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog title="Delete Problem" message="Delete this practice problem?" onConfirm={handleDelete} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
