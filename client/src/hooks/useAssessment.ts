import { useEffect, useState } from 'react';
import { ApiClientError, classifyError } from '../api/client.js';
import type { Assessment, AttemptResult, AttemptSummary, PaginatedAttempts } from '../api/types.js';
import type { QuestionDraft } from '../features/assessments/QuestionEditor.js';

type View = 'idle' | 'creating' | 'taking' | 'results';

interface AssessmentApi {
  get: (parentId: string) => Promise<Assessment | null>;
  create: (parentId: string, data: { questions: QuestionDraft[] }) => Promise<Assessment>;
  update?: (assessmentId: string, data: { questions: QuestionDraft[] }) => Promise<Assessment>;
  submitAttempt: (id: string, answers: unknown[]) => Promise<AttemptResult>;
  getAttempts?: (id: string) => Promise<PaginatedAttempts>;
}

export default function useAssessment(api: AssessmentApi, parentId: string) {
  const [assessment, setAssessment] = useState<Assessment | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('idle');
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);

  useEffect(() => {
    api.get(parentId)
      .then(setAssessment)
      .catch((err: unknown) => setError(err instanceof ApiClientError ? classifyError(err) : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [parentId]);

  useEffect(() => {
    if (assessment && api.getAttempts) {
      api.getAttempts(assessment.id)
        .then((res) => setAttempts(res.data))
        .catch((err: unknown) => {
          setError(err instanceof ApiClientError ? classifyError(err) : 'Failed to load attempt history');
        });
    }
  }, [assessment]);

  async function handleCreate(questions: QuestionDraft[]) {
    const created = await api.create(parentId, { questions });
    setAssessment(created);
    setView('idle');
  }

  async function handleUpdate(questions: QuestionDraft[]) {
    if (!api.update || !assessment) return;
    const updated = await api.update(assessment.id, { questions });
    setAssessment(updated);
    setView('idle');
  }

  async function handleSubmit(answers: unknown[]) {
    if (!assessment) return;
    const res = await api.submitAttempt(assessment.id, answers);
    setResult(res);
    if (api.getAttempts) {
      api.getAttempts(assessment.id)
        .then((res) => setAttempts(res.data))
        .catch(() => {
          // Non-fatal: attempt history refresh after submit; user already has results
        });
    }
    setView('results');
  }

  const lastAttempt = result
    ? { score: result.score, passed: result.passed }
    : (assessment?.lastAttempt ?? null);

  return {
    assessment, loading, error,
    view, setView,
    result, attempts, lastAttempt,
    handleCreate, handleUpdate, handleSubmit,
  };
}
