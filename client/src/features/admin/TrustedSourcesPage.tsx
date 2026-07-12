import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

import { trustedSourcesApi } from '../../api/trusted-sources.js';
import { ApiClientError, classifyError } from '../../api/client.js';

import type { TrustedSource } from '../../api/types.js';

import TrustedSourceForm from './TrustedSourceForm.js';

import Button from '../../components/Button.js';
import Modal from '../../components/Modal.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';

type Filter = 'all' | 'active' | 'inactive';

const filterParam: Record<Filter, boolean | undefined> = {
  all: undefined,
  active: true,
  inactive: false,
};

export default function TrustedSourcesPage() {
  const [sources, setSources] = useState<TrustedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<TrustedSource | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchSources = useCallback((f: Filter) => {
    setLoading(true);
    setError(null);
    trustedSourcesApi
      .getAll(filterParam[f])
      .then((data) => setSources(data))
      .catch((err: unknown) => {
        if (err instanceof ApiClientError) {
          setError(classifyError(err));
        } else {
          setError('Failed to load trusted sources.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSources(filter);
  }, [filter, fetchSources]);

  async function handleDeactivate(source: TrustedSource) {
    setTogglingId(source.id);
    try {
      await trustedSourcesApi.deactivate(source.id);
      setSources((prev) =>
        prev.map((s) => (s.id === source.id ? { ...s, active: false } : s)),
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(classifyError(err));
      } else {
        setError('Failed to deactivate source.');
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function handleReactivate(source: TrustedSource) {
    setTogglingId(source.id);
    try {
      const updated = await trustedSourcesApi.update(source.id, { active: true });
      setSources((prev) =>
        prev.map((s) => (s.id === source.id ? updated : s)),
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(classifyError(err));
      } else {
        setError('Failed to reactivate source.');
      }
    } finally {
      setTogglingId(null);
    }
  }

  function handleFormSuccess(source: TrustedSource) {
    if (editing) {
      setSources((prev) => prev.map((s) => (s.id === source.id ? source : s)));
      setEditing(null);
    } else {
      setSources((prev) => [source, ...prev]);
      setShowAdd(false);
    }
  }

  const filterButtons: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-foreground">Trusted Sources</h1>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
          Add Source
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2" role="group" aria-label="Filter sources">
        {filterButtons.map(({ label, value }) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              filter === value
                ? 'bg-primary-subtle text-green-surface-text'
                : 'bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-raised border border-border'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <section className="bg-surface rounded-2xl shadow-warm-sm border border-border overflow-hidden">
          <p aria-live="polite" className="sr-only">
            {sources.length} {sources.length === 1 ? 'source' : 'sources'} loaded
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-raised">
                <th scope="col" className="text-left px-4 py-3 font-semibold text-foreground">Name</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-foreground">Domain</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-foreground hidden md:table-cell">Content Types</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-foreground hidden md:table-cell">Categories</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr
                  key={source.id}
                  className="border-b border-border last:border-0 hover:bg-surface-raised transition-colors"
                >
                  <td className="px-4 py-3 text-foreground font-medium">{source.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{source.domain}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {source.contentTypes.join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {source.categories.join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        source.active
                          ? 'bg-green-surface text-green-surface-text'
                          : 'bg-surface-raised text-muted-foreground border border-border'
                      }`}
                    >
                      {source.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(source)}
                        disabled={togglingId === source.id}
                        aria-label={`Edit ${source.name}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={source.active ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() =>
                          source.active
                            ? void handleDeactivate(source)
                            : void handleReactivate(source)
                        }
                        disabled={togglingId === source.id}
                        aria-label={
                          source.active
                            ? `Deactivate ${source.name}`
                            : `Reactivate ${source.name}`
                        }
                      >
                        {togglingId === source.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : source.active ? (
                          'Deactivate'
                        ) : (
                          'Reactivate'
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {sources.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No trusted sources found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {showAdd && (
        <Modal title="Add Trusted Source" onClose={() => setShowAdd(false)}>
          <TrustedSourceForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Trusted Source" onClose={() => setEditing(null)}>
          <TrustedSourceForm
            source={editing}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
