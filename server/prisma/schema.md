# Course Masters — Database Schema

## Auth Models

| **User** | |
|---|---|
| `id` | PK |
| `name` | string |
| `email` | UQ |
| `emailVerified` | bool |
| `image` | string? |
| `role` | default "student" |
| `banned` | bool? |
| `banReason` | string? |
| `banExpires` | datetime? |
| → | Session[], Account[], Course[], QuizAttempt[], TestAttempt[], ExamAttempt[], StudentNote[], LessonResourceCompletion[] |

| **Session** | |
|---|---|
| `id` | PK |
| `token` | UQ |
| `expiresAt` | datetime |
| `ipAddress` | string? |
| `userAgent` | string? |
| `userId` | FK → **User** (cascade) |

| **Account** | |
|---|---|
| `id` | PK |
| `accountId` | string |
| `providerId` | string |
| `userId` | FK → **User** (cascade) |
| `accessToken` | string? |
| `refreshToken` | string? |
| `password` | string? |

| **Verification** | |
|---|---|
| `id` | PK |
| `identifier` | string |
| `value` | string |
| `expiresAt` | datetime |

---

## Core Hierarchy

```
User (1) ──→ (*) Course (1) ──→ (*) Unit (1) ──→ (*) Lesson
```

| **Course** | |
|---|---|
| `id` | PK (uuid) |
| `title` | string |
| `description` | string |
| `syllabus` | json? |
| `authorId` | FK → **User** (cascade) |
| → | Unit[], FinalExam? |

| **Unit** | |
|---|---|
| `id` | PK (uuid) |
| `title` | string |
| `description` | string |
| `order` | int |
| `courseId` | FK → **Course** (cascade) |
| → | Lesson[], Test? |

| **Lesson** | |
|---|---|
| `id` | PK (uuid) |
| `title` | string |
| `description` | string |
| `order` | int |
| `objective` | string? |
| `planContent` | json? |
| `vocabOrder` | int? |
| `unitId` | FK → **Unit** (cascade) |
| → | Note[], FlashCard[], PracticeProblem[], Quiz?, StudentNote[], Vocab[], Video[], LessonResourceCompletion[] |

---

## Lesson Content

| **Note** | |
|---|---|
| `id` | PK (uuid) |
| `title` | string |
| `content` | json |
| `order` | int |
| `lessonId` | FK → **Lesson** (cascade) |

| **FlashCard** | |
|---|---|
| `id` | PK (uuid) |
| `front` | string |
| `back` | string |
| `order` | int |
| `lessonId` | FK → **Lesson** (cascade) |

| **PracticeProblem** | |
|---|---|
| `id` | PK (uuid) |
| `question` | string |
| `options` | json |
| `correctIndex` | int |
| `order` | int |
| `lessonId` | FK → **Lesson** (cascade) |

| **Vocab** | |
|---|---|
| `id` | PK (uuid) |
| `term` | string |
| `definition` | string |
| `order` | int |
| `lessonId` | FK → **Lesson** (cascade) |

| **Video** | |
|---|---|
| `id` | PK (uuid) |
| `title` | string |
| `url` | string |
| `order` | int |
| `transcript` | string? |
| `summary` | string? |
| `lessonId` | FK → **Lesson** (cascade) |

| **StudentNote** | |
|---|---|
| `id` | PK (uuid) |
| `content` | string |
| `lessonId` | FK → **Lesson** (cascade) |
| `userId` | FK → **User** (cascade) |
| | UQ(`lessonId`, `userId`) |

---

## Assessments

### Quiz (per Lesson)

| **Quiz** | |
|---|---|
| `id` | PK (uuid) |
| `lessonId` | FK UQ → **Lesson** (cascade) |
| → | QuizQuestion[], QuizAttempt[] |

| **QuizQuestion** | |
|---|---|
| `id` | PK (uuid) |
| `question` | string |
| `options` | json |
| `correctIndex` | int |
| `order` | int |
| `quizId` | FK → **Quiz** (cascade) |

| **QuizAttempt** | |
|---|---|
| `id` | PK (uuid) |
| `score` | float |
| `passed` | bool |
| `userId` | FK → **User** (cascade) |
| `quizId` | FK → **Quiz** (cascade) |

### Test (per Unit)

| **Test** | |
|---|---|
| `id` | PK (uuid) |
| `unitId` | FK UQ → **Unit** (cascade) |
| → | TestQuestion[], TestAttempt[] |

| **TestQuestion** | |
|---|---|
| `id` | PK (uuid) |
| `question` | string |
| `options` | json |
| `correctIndex` | int |
| `order` | int |
| `testId` | FK → **Test** (cascade) |

| **TestAttempt** | |
|---|---|
| `id` | PK (uuid) |
| `score` | float |
| `passed` | bool |
| `userId` | FK → **User** (cascade) |
| `testId` | FK → **Test** (cascade) |

### Final Exam (per Course)

| **FinalExam** | |
|---|---|
| `id` | PK (uuid) |
| `courseId` | FK UQ → **Course** (cascade) |
| → | FinalExamQuestion[], ExamAttempt[] |

| **FinalExamQuestion** | |
|---|---|
| `id` | PK (uuid) |
| `question` | string |
| `options` | json |
| `correctIndex` | int |
| `order` | int |
| `examId` | FK → **FinalExam** (cascade) |

| **ExamAttempt** | |
|---|---|
| `id` | PK (uuid) |
| `score` | float |
| `passed` | bool |
| `userId` | FK → **User** (cascade) |
| `examId` | FK → **FinalExam** (cascade) |

---

## Progress Tracking

| **LessonResourceCompletion** | |
|---|---|
| `id` | PK (uuid) |
| `userId` | FK → **User** (cascade) |
| `lessonId` | FK → **Lesson** (cascade) |
| `resourceType` | string |
| `resourceId` | string |
| `completedAt` | datetime |
| | UQ(`userId`, `resourceType`, `resourceId`) |
| | IDX(`userId`, `lessonId`) |

---

## Relationships Summary

| Parent | Relationship | Child |
|---|---|---|
| **User** | 1 → * | Session, Account, Course, QuizAttempt, TestAttempt, ExamAttempt, StudentNote, LessonResourceCompletion |
| **Course** | 1 → * | Unit |
| **Course** | 1 → 0..1 | FinalExam |
| **Unit** | 1 → * | Lesson |
| **Unit** | 1 → 0..1 | Test |
| **Lesson** | 1 → * | Note, FlashCard, PracticeProblem, Vocab, Video, StudentNote, LessonResourceCompletion |
| **Lesson** | 1 → 0..1 | Quiz |
| **Quiz** | 1 → * | QuizQuestion, QuizAttempt |
| **Test** | 1 → * | TestQuestion, TestAttempt |
| **FinalExam** | 1 → * | FinalExamQuestion, ExamAttempt |

> All foreign keys use **cascade delete**. All IDs are UUIDs. **20 models** total.
