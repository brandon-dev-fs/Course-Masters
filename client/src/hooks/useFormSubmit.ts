import { type Dispatch, type FormEvent, type SetStateAction, useState } from 'react';
import { ApiClientError, classifyError } from '../api/client.js';

export default function useFormSubmit(
  onSubmit: () => Promise<void>,
): {
  error: string;
  submitting: boolean;
  handleSubmit: (e: FormEvent) => Promise<void>;
  setError: Dispatch<SetStateAction<string>>;
} {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSubmit();
    } catch (err: unknown) {
      setError(err instanceof ApiClientError ? classifyError(err) : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return { error, submitting, handleSubmit, setError };
}
