import { useState } from 'react';
import Input from '../../components/Input.js';
import Textarea from '../../components/Textarea.js';
import Button from '../../components/Button.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import { ApiClientError, classifyError } from '../../api/client.js';
import type { Course } from '../../api/types.js';

interface CourseFormProps {
  initial?: Partial<Course>;
  onSubmit: (data: { title: string; description: string }) => Promise<void>;
  onCancel: () => void;
}

export default function CourseForm({ initial, onSubmit, onCancel }: CourseFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (!title.trim()) throw new Error('Title is required');
      if (!description.trim()) throw new Error('Description is required');
      await onSubmit({ title: title.trim(), description: description.trim() });
    } catch (err: unknown) {
      setError(err instanceof ApiClientError ? classifyError(err) : err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Input id="title" label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Introduction to Python" maxLength={30} autoFocus />
        <p className="text-xs text-muted-foreground text-right mt-1">{title.length}/30</p>
      </div>
      <Textarea id="description" label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="What will students learn?" rows={3} />
      {error && <ErrorMessage message={error} />}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={!(title.trim().length > 0 && description.trim().length > 0) || submitting}>{submitting ? 'Saving...' : initial?.id ? 'Save Changes' : 'Create Course'}</Button>
      </div>
    </form>
  );
}
