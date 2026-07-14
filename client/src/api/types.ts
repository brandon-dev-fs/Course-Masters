export type UserRole = 'student' | 'teacher' | 'admin';
export type AssessmentType = 'lesson_quiz' | 'unit_quiz' | 'course_exam';
export type QuestionType = 'multiple_choice' | 'true_false' | 'matching' | 'fill_in_blank';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  themePreference: ThemePreference | null;
  createdAt: string;
}

export interface UpdatePreferencesInput {
  themePreference: ThemePreference;
}

export interface UpdatePreferencesResponse {
  themePreference: ThemePreference;
}

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

/** Tiptap JSON document shape stored in note and lecture content. */
export type TiptapJSON = Record<string, unknown>;

export interface StudyCard {
  id: string;
  front: string;
  back: string;
}

export interface AssignmentCompletionItem {
  assignmentId: string;
  completedAt: string;
}

export interface CompletionsResponse {
  completions: AssignmentCompletionItem[];
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
  correct: boolean;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface MatchingContent {
  pairs: MatchingPair[];
}

export interface FillInBlankBlank {
  answer: string;
  alternatives?: string[];
}

export interface FillInBlankContent {
  blanks: FillInBlankBlank[];
}

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

export type AssignmentType = 'note' | 'video' | 'reading' | 'vocab' | 'practice_problem' | 'file';
export type PracticeQuestionType = 'multiple_choice' | 'true_false' | 'matching' | 'fill_in_blank';

export interface NoteAssignmentData {
  id: string;
  content: Record<string, unknown>;
}

export interface VideoAssignmentData {
  id: string;
  url: string;
}

export interface ReadingAssignmentData {
  id: string;
  url: string;
  estimatedMinutes: number | null;
}

export interface VocabEntry {
  id?: string;   // present for existing entries from DB, absent for new form entries
  term: string;
  definition: string;
  example?: string;
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

export interface FileAssignmentData {
  id: string;
  assignmentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Bookmark {
  id: string;
  note: string;
  updatedAt: string;
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
  fileAssignment: FileAssignmentData | null;
  bookmark: Bookmark | null;
}

export interface AssignmentCompletion {
  id: string;
  userId: string;
  assignmentId: string;
  completedAt: string;
}

// ─── Builder Outline ─────────────────────────────────────────────────────────

export interface BuilderCourseInfo {
  id: string;
  title: string;
  description: string;
}

export interface BuilderAssessment {
  id: string;
  type: AssessmentType;
  questionCount: number;
}

export interface BuilderActivity {
  id: string;
  title: string;
  type: AssignmentType;
  order: number;
}

export interface BuilderLesson {
  id: string;
  title: string;
  order: number;
  hasLessonPlan: boolean;
  assignments: BuilderActivity[];
  assessment: BuilderAssessment | null;
}

export interface BuilderUnit {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: BuilderLesson[];
  assessment: BuilderAssessment | null;
}

export interface BuilderOutline {
  course: BuilderCourseInfo;
  units: BuilderUnit[];
  courseAssessment: BuilderAssessment | null;
}

export interface ReorderItem {
  id: string;
  order: number;
}

// ─── Checklist ───────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  lessonId: string;
  text: string;
  checked: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// --- Trusted Sources ---

export interface TrustedSource {
  id: string;
  name: string;
  domain: string;
  contentTypes: string[];
  categories: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
