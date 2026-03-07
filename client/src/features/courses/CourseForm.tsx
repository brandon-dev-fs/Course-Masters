import { FormEvent, useState } from 'react';
import Input from '../../components/Input.js';
import Textarea from '../../components/Textarea.js';
import Button from '../../components/Button.js';
import type { Course } from '../../api/types.js';

interface CourseFormProps {
  initial?: Partial<Course>;
  onSubmit: (data: { title: string; description?: string }) => Promise<void>;
  onCancel: () => void;
}

export default function CourseForm({ initial, onSubmit, onCancel }: CourseFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ title: title.trim(), description: description.trim() || undefined });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="title"
        label="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="e.g. Introduction to Python"
        error={error && !title.trim() ? error : undefined}
        autoFocus
      />
      <Textarea
        id="description"
        label="Description (optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="What will students learn?"
        rows={3}
      />
      {error && title.trim() && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : initial?.id ? 'Save Changes' : 'Create Course'}
        </Button>
      </div>
    </form>
  );
}
