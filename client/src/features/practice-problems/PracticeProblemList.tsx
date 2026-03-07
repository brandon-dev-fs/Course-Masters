import { useEffect, useState } from 'react';
import { practiceProblemsApi } from '../../api/practice-problems.js';
import type { PracticeProblem } from '../../api/types.js';
import PracticeProblemCard from './PracticeProblemCard.js';
import PracticeProblemForm from './PracticeProblemForm.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';

export default function PracticeProblemList({ lessonId }: { lessonId: string }) {
  const [problems, setProblems] = useState<PracticeProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<PracticeProblem | null>(null);
  const [deleting, setDeleting] = useState<PracticeProblem | null>(null);

  useEffect(() => {
    practiceProblemsApi.getAll(lessonId)
      .then(setProblems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load problems'))
      .finally(() => setLoading(false));
  }, [lessonId]);

  async function handleAdd(data: { question: string; answer: string; order: number }) {
    const prob = await practiceProblemsApi.create(lessonId, data);
    setProblems(prev => [...prev, prob].sort((a, b) => a.order - b.order));
    setShowAdd(false);
  }

  async function handleUpdate(data: { question: string; answer: string; order: number }) {
    if (!editing) return;
    const updated = await practiceProblemsApi.update(editing.id, data);
    setProblems(prev => prev.map(p => p.id === updated.id ? updated : p).sort((a, b) => a.order - b.order));
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    await practiceProblemsApi.delete(deleting.id);
    setProblems(prev => prev.filter(p => p.id !== deleting.id));
    setDeleting(null);
  }

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
