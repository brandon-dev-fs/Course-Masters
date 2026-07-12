import { useState } from 'react';

import { trustedSourcesApi } from '../../api/trusted-sources.js';
import { ApiClientError, classifyError } from '../../api/client.js';

import type { TrustedSource } from '../../api/types.js';

import Button from '../../components/Button.js';
import Input from '../../components/Input.js';
import ErrorMessage from '../../components/ErrorMessage.js';

interface TrustedSourceFormProps {
  source?: TrustedSource;
  onSuccess: (source: TrustedSource) => void;
  onCancel: () => void;
}

export default function TrustedSourceForm({ source, onSuccess, onCancel }: TrustedSourceFormProps) {
  const [name, setName] = useState(source?.name ?? '');
  const [domain, setDomain] = useState(source?.domain ?? '');
  const [contentTypes, setContentTypes] = useState(source?.contentTypes.join(', ') ?? '');
  const [categories, setCategories] = useState(source?.categories.join(', ') ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function parseList(raw: string): string[] {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!domain.trim()) {
      setError('Domain is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        domain: domain.trim(),
        contentTypes: parseList(contentTypes),
        categories: parseList(categories),
      };

      const result = source
        ? await trustedSourcesApi.update(source.id, payload)
        : await trustedSourcesApi.create(payload);

      onSuccess(result);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(classifyError(err));
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-4">
      {error && <ErrorMessage message={error} />}

      <Input
        id="ts-name"
        label="Name"
        value={name}
        onChange={(e) => {
          setError(null);
          setName(e.target.value);
        }}
        placeholder="e.g. Khan Academy"
        required
        disabled={submitting}
      />

      <Input
        id="ts-domain"
        label="Domain"
        value={domain}
        onChange={(e) => {
          setError(null);
          setDomain(e.target.value);
        }}
        placeholder="e.g. khanacademy.org"
        required
        disabled={submitting}
      />

      <Input
        id="ts-content-types"
        label="Content Types (comma-separated)"
        value={contentTypes}
        onChange={(e) => {
          setError(null);
          setContentTypes(e.target.value);
        }}
        placeholder="e.g. video, article"
        disabled={submitting}
      />

      <Input
        id="ts-categories"
        label="Categories (comma-separated)"
        value={categories}
        onChange={(e) => {
          setError(null);
          setCategories(e.target.value);
        }}
        placeholder="e.g. math, science"
        disabled={submitting}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting && (
            <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          )}
          {source ? 'Save Changes' : 'Add Source'}
        </Button>
      </div>
    </form>
  );
}
