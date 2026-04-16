export type UserRole = 'student' | 'teacher' | 'admin';
export type AssessmentType = 'lesson_quiz' | 'unit_quiz' | 'course_exam';
export type QuestionType = 'multiple_choice' | 'true_false' | 'matching' | 'fill_in_blank';
export type ResourceType = 'note' | 'video' | 'lecture';
export type ToolType = 'flash_card' | 'practice_problem' | 'vocab';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
  syllabus?: Record<string, unknown> | null;
  authorId: string;
  author?: { id: string; name: string };
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
  objective: string;
  planContent: Record<string, unknown>;
}

export interface LessonResource {
  id: string;
  type: ResourceType;
  title: string;
  content: Record<string, unknown>;
  order: number;
  lessonId: string;
}

export interface LessonTool {
  id: string;
  type: ToolType;
  title: string;
  content: Record<string, unknown>;
  order: number;
  lessonId: string;
}

export interface ResourceCompletionItem {
  resourceType: string;
  resourceId: string;
}

export interface StudentNote {
  id: string;
  content: string;
  lessonId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  question: string;
  content: Record<string, unknown>;
  order: number;
}

export interface Assessment {
  id: string;
  type: AssessmentType;
  calculatorAllowed: boolean;
  questions: AssessmentQuestion[];
  lastAttempt?: { score: number; passed: boolean } | null;
}

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
  units: {
    unitId: string;
    title: string;
    order: number;
    isComplete: boolean;
    totalLessons: number;
    completedLessons: number;
    testPassed: boolean;
    lessons: LessonProgress[];
  }[];
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
