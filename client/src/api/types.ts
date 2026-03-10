export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  units?: Unit[];
  _count?: { units: number };
}

export interface Unit {
  id: string;
  title: string;
  order: number;
  courseId: string;
  lessons?: Lesson[];
  _count?: { lessons: number };
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  order: number;
  unitId: string;
}

export interface Note {
  id: string;
  content: string;
  order: number;
  lessonId: string;
}

export interface FlashCard {
  id: string;
  front: string;
  back: string;
  order: number;
  lessonId: string;
}

export interface PracticeProblem {
  id: string;
  question: string;
  answer: string;
  order: number;
  lessonId: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  order: number;
  quizId: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  questions: QuizQuestion[];
}

export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  order: number;
  testId: string;
}

export interface Test {
  id: string;
  unitId: string;
  questions: TestQuestion[];
  lastAttempt: { score: number; passed: boolean } | null;
}

export interface FinalExamQuestion {
  id: string;
  question: string;
  options: string[];
  order: number;
  examId: string;
}

export interface FinalExam {
  id: string;
  courseId: string;
  questions: FinalExamQuestion[];
  lastAttempt: { score: number; passed: boolean } | null;
}

export interface AttemptResult {
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctCount: number;
}

export interface CourseProgress {
  totalUnits: number;
  completedUnits: number;
  totalLessons: number;
  completedLessons: number;
  examPassed: boolean;
  examScore: number | null;
  percentComplete: number;
}

export interface UnitProgress {
  totalLessons: number;
  completedLessons: number;
  testPassed: boolean;
  percentComplete: number;
  lessons: LessonProgress[];
}

export interface LessonProgress {
  lessonId: string;
  hasQuiz: boolean;
  attempted: boolean;
  quizPassed: boolean;
}
