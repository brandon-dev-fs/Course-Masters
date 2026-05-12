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

// ─── LessonResource discriminated union ─────────────────────────────────────

/** Tiptap JSON document shape stored in note and lecture content. */
export type TiptapJSON = Record<string, unknown>;

export interface NoteContent {
  body: TiptapJSON;
}

export interface VideoContent {
  url: string;
}

export interface NoteResource {
  id: string;
  type: 'note';
  title: string;
  content: NoteContent;
  order: number;
  lessonId: string;
  isRequired: boolean;
}

export interface VideoResource {
  id: string;
  type: 'video';
  title: string;
  content: VideoContent;
  order: number;
  lessonId: string;
  isRequired: boolean;
}

export interface LectureResource {
  id: string;
  type: 'lecture';
  title: string;
  content: NoteContent;
  order: number;
  lessonId: string;
  isRequired: boolean;
}

export type LessonResource = NoteResource | VideoResource | LectureResource;

// ─── LessonTool discriminated union ─────────────────────────────────────────

export interface FlashCardContent {
  front: string;
  back: string;
}

export interface PracticeProblemContent {
  question: string;
  options: string[];
  correctIndex: number;
  calculatorEnabled?: boolean;
}

export interface VocabContent {
  term: string;
  definition: string;
}

export interface FlashCardTool {
  id: string;
  type: 'flash_card';
  title: string;
  content: FlashCardContent;
  order: number;
  lessonId: string;
  isRequired: boolean;
}

export interface PracticeProblemTool {
  id: string;
  type: 'practice_problem';
  title: string;
  content: PracticeProblemContent;
  order: number;
  lessonId: string;
  isRequired: boolean;
}

export interface VocabTool {
  id: string;
  type: 'vocab';
  title: string;
  content: VocabContent;
  order: number;
  lessonId: string;
  isRequired: boolean;
}

export type LessonTool = FlashCardTool | PracticeProblemTool | VocabTool;

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

// ─── AssessmentQuestion discriminated union ──────────────────────────────────

export interface MultipleChoiceContent {
  options: string[];
  correctIndex: number;
}

export interface TrueFalseContent {
  correctAnswer: boolean;
}

/** Matching and fill-in-blank content shapes are reserved for future use. */
export type MatchingContent = Record<string, unknown>;
export type FillInBlankContent = Record<string, unknown>;

export interface MultipleChoiceQuestion {
  id: string;
  type: 'multiple_choice';
  question: string;
  content: MultipleChoiceContent;
  order: number;
  calculatorEnabled: boolean;
}

export interface TrueFalseQuestion {
  id: string;
  type: 'true_false';
  question: string;
  content: TrueFalseContent;
  order: number;
  calculatorEnabled: boolean;
}

export interface MatchingQuestion {
  id: string;
  type: 'matching';
  question: string;
  content: MatchingContent;
  order: number;
  calculatorEnabled: boolean;
}

export interface FillInBlankQuestion {
  id: string;
  type: 'fill_in_blank';
  question: string;
  content: FillInBlankContent;
  order: number;
  calculatorEnabled: boolean;
}

export type AssessmentQuestion =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | MatchingQuestion
  | FillInBlankQuestion;

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
