import prisma from '../../lib/prisma.js';
import { NotFoundError } from '../../errors/index.js';
import type { CreateAssessmentInput, SubmitAttemptInput } from '../../schemas/assessment.schema.js';

const PASS_THRESHOLD = 0.8;

interface AssessmentConfig {
  parentDelegate: { findUnique(args: any): Promise<any> };
  parentIdField: string;
  parentName: string;
  assessmentDelegate: { findUnique(args: any): Promise<any>; create(args: any): Promise<any> };
  assessmentName: string;
  attemptDelegate: { create(args: any): Promise<any> };
  attemptFkField: string;
  includeLastAttempt?: boolean;
}

function omitCorrectIndex(questions: Array<{ correctIndex: unknown; [k: string]: unknown }>) {
  return questions.map(({ correctIndex: _ci, ...q }) => q);
}

export function createAssessmentService(config: AssessmentConfig) {
  const { parentDelegate, parentIdField, parentName, assessmentDelegate, assessmentName, attemptDelegate, attemptFkField, includeLastAttempt } = config;

  return {
    async find(parentId: string) {
      const parent = await parentDelegate.findUnique({ where: { id: parentId } });
      if (!parent) throw new NotFoundError(`${parentName} not found`);

      const include: any = { questions: { orderBy: { order: 'asc' } } };
      if (includeLastAttempt) include.attempts = { orderBy: { createdAt: 'desc' }, take: 1 };

      const assessment = await assessmentDelegate.findUnique({
        where: { [parentIdField]: parentId },
        include,
      });
      if (!assessment) return null;

      const result: any = { ...assessment, questions: omitCorrectIndex(assessment.questions) };
      if (includeLastAttempt) {
        const lastAttempt = assessment.attempts[0] ?? null;
        result.lastAttempt = lastAttempt ? { score: lastAttempt.score, passed: lastAttempt.passed } : null;
      }
      return result;
    },

    async create(parentId: string, data: CreateAssessmentInput) {
      const parent = await parentDelegate.findUnique({ where: { id: parentId } });
      if (!parent) throw new NotFoundError(`${parentName} not found`);
      return assessmentDelegate.create({
        data: { [parentIdField]: parentId, questions: { create: data.questions } },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
    },

    async submitAttempt(assessmentId: string, data: SubmitAttemptInput, userId: string) {
      const assessment = await assessmentDelegate.findUnique({
        where: { id: assessmentId },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
      if (!assessment) throw new NotFoundError(`${assessmentName} not found`);

      const { answers } = data;
      let correct = 0;
      assessment.questions.forEach((q: any, i: number) => {
        if (answers[i] === q.correctIndex) correct++;
      });

      const score = assessment.questions.length > 0 ? correct / assessment.questions.length : 0;
      const passed = score >= PASS_THRESHOLD;

      const attempt = await attemptDelegate.create({
        data: { [attemptFkField]: assessmentId, userId, score, passed },
      });

      return { ...attempt, totalQuestions: assessment.questions.length, correctCount: correct };
    },
  };
}
