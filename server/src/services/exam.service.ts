import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateAssessmentInput, SubmitAttemptInput } from '../schemas/assessment.schema.js';

const PASS_THRESHOLD = 0.8;

async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new NotFoundError('No users found — run seed first');
  return user.id;
}

export const examService = {
  async findByCourse(courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundError('Course not found');
    const exam = await prisma.finalExam.findUnique({
      where: { courseId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!exam) return null;
    return {
      ...exam,
      questions: exam.questions.map(({ correctIndex: _ci, ...q }) => q),
    };
  },

  async create(courseId: string, data: CreateAssessmentInput) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundError('Course not found');
    return prisma.finalExam.create({
      data: { courseId, questions: { create: data.questions } },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  },

  async submitAttempt(examId: string, data: SubmitAttemptInput) {
    const exam = await prisma.finalExam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!exam) throw new NotFoundError('Exam not found');

    const { answers } = data;
    let correct = 0;
    exam.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++;
    });

    const score = exam.questions.length > 0 ? correct / exam.questions.length : 0;
    const passed = score >= PASS_THRESHOLD;
    const userId = await getDefaultUserId();

    const attempt = await prisma.examAttempt.create({
      data: { examId, userId, score, passed },
    });

    return { ...attempt, totalQuestions: exam.questions.length, correctCount: correct };
  },
};
