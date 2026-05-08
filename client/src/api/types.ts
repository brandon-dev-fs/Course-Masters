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
  isRequired: boolean;
}

export interface LessonTool {
  id: string;
  type: ToolType;
  title: string;
  content: Record<string, unknown>;
  order: number;
  lessonId: string;
  isRequired: boolean;
}

export interface ResourceCompletionItem {
  resourceType: string;
  resourceId: string;
  isRequired: boolean;
}

export interface CompletionsResponse {
  completions: ResourceCompletionItem[];
  requiredItems: ResourceCompletionItem[];
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
  calculatorEnabled: boolean;
}

export interface Assessment {
  id: string;
  type: AssessmentType;
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

export interface PaginatedAttempts {
  data: AttemptSummary[];
  total: number;
  page: number;
  pageSize: number;
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

// ─── Assignment Layer ────────────────────────────────────────────────────────

export type AssignmentType = 'note' | 'video' | 'reading' | 'vocab' | 'practice_problem';
export type PracticeQuestionType = 'multiple_choice' | 'true_false' | 'matching' | 'fill_in_blank';

export interface NoteAssignmentData {
  id: string;
  content: Record<string, unknown>;
}

export interface VideoAssignmentData {
  id: string;
  url: string;
  title: string | null;
}

export interface ReadingAssignmentData {
  id: string;
  url: string;
  description: string | null;
  estimatedMinutes: number | null;
}

export interface VocabEntry {
  term: string;
  definition: string;
}

export interface VocabAssignmentData {
  id: string;
  entries: VocabEntry[];
}

export interface PracticeQuestion {
  id: string;
  order: number;
  type: PracticeQuestionType;
  content: Record<string, unknown>;
}

export interface PracticeProblemAssignmentData {
  id: string;
  passingPercentage: number | null;
  questions: PracticeQuestion[];
}

export interface Assignment {
  id: string;
  lessonId: string;
  order: number;
  title: string;
  objective: string | null;
  type: AssignmentType;
  createdAt: string;
  updatedAt: string;
  completed: boolean;
  noteAssignment: NoteAssignmentData | null;
  videoAssignment: VideoAssignmentData | null;
  readingAssignment: ReadingAssignmentData | null;
  vocabAssignment: VocabAssignmentData | null;
  practiceProblemAssignment: PracticeProblemAssignmentData | null;
}

export interface AssignmentCompletion {
  id: string;
  userId: string;
  assignmentId: string;
  completedAt: string;
}
