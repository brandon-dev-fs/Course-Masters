export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  image?: string | null;
  emailVerified: boolean;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  units?: Unit[];
  _count?: { units: number };
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  order: number;
  courseId: string;
  lessons?: Lesson[];
  _count?: { lessons: number };
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  order: number;
  unitId: string;
}

export interface Note {
  id: string;
  content: Record<string, unknown>;
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
  options: string[];
  correctIndex: number;
  order: number;
  lessonId: string;
}

export interface StudentNote {
  id: string;
  content: string;
  lessonId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vocab {
  id: string;
  term: string;
  definition: string;
  order: number;
  lessonId: string;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  order: number;
  transcript: string | null;
  summary: string | null;
  lessonId: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  order: number;
}

export interface Assessment {
  id: string;
  questions: AssessmentQuestion[];
  lastAttempt?: { score: number; passed: boolean } | null;
}

// Specific aliases for backward compatibility with API modules
export type QuizQuestion = AssessmentQuestion & { quizId: string };
export type Quiz = Assessment & { lessonId: string };
export type TestQuestion = AssessmentQuestion & { testId: string };
export type Test = Assessment & { unitId: string; lastAttempt: { score: number; passed: boolean } | null };
export type FinalExamQuestion = AssessmentQuestion & { examId: string };
export type FinalExam = Assessment & { courseId: string; lastAttempt: { score: number; passed: boolean } | null };

export interface AttemptResult {
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctCount: number;
}

export interface AttemptSummary {
  id: string;
  score: number;
  passed: boolean;
  createdAt: string;
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
