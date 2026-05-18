import { describe, it, expect } from 'vitest';
import {
  createAssessmentSchema,
  submitAttemptSchema,
  bulkUpdateCalculatorSchema,
  attemptsQuerySchema,
  questionSchema,
} from '../../schemas/assessment.schema.js';

// ── questionSchema ────────────────────────────────────────────────────────────

describe('questionSchema — multiple_choice', () => {
  it('accepts valid multiple_choice question', () => {
    const result = questionSchema.safeParse({
      type: 'multiple_choice',
      question: 'What is 2+2?',
      content: { options: ['3', '4', '5'], correctIndex: 1 },
      order: 0,
      calculatorEnabled: false,
    });
    expect(result.success).toBe(true);
  });

  it('defaults calculatorEnabled to false', () => {
    const result = questionSchema.safeParse({
      type: 'multiple_choice',
      question: 'Q?',
      content: { options: ['A'], correctIndex: 0 },
      order: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.calculatorEnabled).toBe(false);
    }
  });

  it('rejects empty question text', () => {
    const result = questionSchema.safeParse({
      type: 'multiple_choice',
      question: '',
      content: { options: ['A'], correctIndex: 0 },
      order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty options array', () => {
    const result = questionSchema.safeParse({
      type: 'multiple_choice',
      question: 'Q?',
      content: { options: [], correctIndex: 0 },
      order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative correctIndex', () => {
    const result = questionSchema.safeParse({
      type: 'multiple_choice',
      question: 'Q?',
      content: { options: ['A'], correctIndex: -1 },
      order: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('questionSchema — true_false', () => {
  it('accepts valid true_false question', () => {
    const result = questionSchema.safeParse({
      type: 'true_false',
      question: 'Is the sky blue?',
      content: { correctAnswer: true },
      order: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-boolean correctAnswer', () => {
    const result = questionSchema.safeParse({
      type: 'true_false',
      question: 'Q?',
      content: { correctAnswer: 'yes' },
      order: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('questionSchema — fill_in_blank', () => {
  it('accepts valid fill_in_blank question', () => {
    const result = questionSchema.safeParse({
      type: 'fill_in_blank',
      question: 'The capital of France is ___.',
      content: { acceptedAnswers: ['Paris', 'paris'] },
      order: 2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty acceptedAnswers array', () => {
    const result = questionSchema.safeParse({
      type: 'fill_in_blank',
      question: 'Q?',
      content: { acceptedAnswers: [] },
      order: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('questionSchema — matching', () => {
  it('accepts valid matching question', () => {
    const result = questionSchema.safeParse({
      type: 'matching',
      question: 'Match each country to its capital.',
      content: { pairs: [{ prompt: 'France', answer: 'Paris' }] },
      order: 3,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty pairs array', () => {
    const result = questionSchema.safeParse({
      type: 'matching',
      question: 'Q?',
      content: { pairs: [] },
      order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects pair with empty prompt', () => {
    const result = questionSchema.safeParse({
      type: 'matching',
      question: 'Q?',
      content: { pairs: [{ prompt: '', answer: 'Answer' }] },
      order: 0,
    });
    expect(result.success).toBe(false);
  });
});

// ── createAssessmentSchema ────────────────────────────────────────────────────

describe('createAssessmentSchema', () => {
  it('accepts a valid questions array', () => {
    const result = createAssessmentSchema.safeParse({
      questions: [
        {
          type: 'multiple_choice',
          question: 'What is 2+2?',
          content: { options: ['3', '4', '5'], correctIndex: 1 },
          order: 0,
          calculatorEnabled: false,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts multiple questions of different types', () => {
    const result = createAssessmentSchema.safeParse({
      questions: [
        {
          type: 'true_false',
          question: 'True or false?',
          content: { correctAnswer: true },
          order: 0,
        },
        {
          type: 'fill_in_blank',
          question: '___ is the capital.',
          content: { acceptedAnswers: ['Paris'] },
          order: 1,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty questions array', () => {
    const result = createAssessmentSchema.safeParse({ questions: [] });
    expect(result.success).toBe(false);
  });

  it('rejects missing questions field', () => {
    const result = createAssessmentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid question type', () => {
    const result = createAssessmentSchema.safeParse({
      questions: [{ type: 'essay', question: 'Q?', content: {}, order: 0 }],
    });
    expect(result.success).toBe(false);
  });
});

// ── submitAttemptSchema ───────────────────────────────────────────────────────

describe('submitAttemptSchema', () => {
  it('accepts valid answers array', () => {
    const result = submitAttemptSchema.safeParse({ answers: [1, 'A', true] });
    expect(result.success).toBe(true);
  });

  it('accepts empty answers array', () => {
    const result = submitAttemptSchema.safeParse({ answers: [] });
    expect(result.success).toBe(true);
  });

  it('rejects missing answers', () => {
    const result = submitAttemptSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ── bulkUpdateCalculatorSchema ────────────────────────────────────────────────

describe('bulkUpdateCalculatorSchema', () => {
  it('accepts valid input with UUID question IDs', () => {
    const result = bulkUpdateCalculatorSchema.safeParse({
      questionIds: ['550e8400-e29b-41d4-a716-446655440000'],
      calculatorEnabled: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty questionIds array', () => {
    const result = bulkUpdateCalculatorSchema.safeParse({
      questionIds: [],
      calculatorEnabled: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID question IDs', () => {
    const result = bulkUpdateCalculatorSchema.safeParse({
      questionIds: ['not-a-uuid'],
      calculatorEnabled: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing calculatorEnabled', () => {
    const result = bulkUpdateCalculatorSchema.safeParse({
      questionIds: ['550e8400-e29b-41d4-a716-446655440000'],
    });
    expect(result.success).toBe(false);
  });
});

// ── attemptsQuerySchema ───────────────────────────────────────────────────────

describe('attemptsQuerySchema', () => {
  it('uses defaults when no values provided', () => {
    const result = attemptsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it('coerces string page and pageSize', () => {
    const result = attemptsQuerySchema.safeParse({ page: '3', pageSize: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.pageSize).toBe(50);
    }
  });

  it('rejects page less than 1', () => {
    const result = attemptsQuerySchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects pageSize greater than 100', () => {
    const result = attemptsQuerySchema.safeParse({ pageSize: '101' });
    expect(result.success).toBe(false);
  });
});
