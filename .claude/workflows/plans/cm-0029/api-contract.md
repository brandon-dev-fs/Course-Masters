---
id: cm-0029
title: 'API Contract: Consolidate LessonResource and LessonTool into Assignment'
stage: design
status: approved
---

# API Contract: Consolidate LessonResource and LessonTool into Assignment

This contract documents all API changes for cm-0029. Removed endpoints will return 404 by virtue of route de-registration (no explicit 404 handler needed). Modified endpoints retain their paths but change request/response shapes. One new endpoint is added.

---

## Removed Endpoints (8)

These routes are de-registered from the Express router. Any request to these paths will fall through to the default 404 handler.

### `GET /api/lessons/:lessonId/resources`

**Status**: REMOVED. Use `GET /api/lessons/:lessonId/assignments` instead.

### `POST /api/lessons/:lessonId/resources`

**Status**: REMOVED. Use `POST /api/lessons/:lessonId/assignments` instead.

### `PUT /api/resources/:resourceId`

**Status**: REMOVED. Use `PUT /api/assignments/:assignmentId` instead.

### `DELETE /api/resources/:resourceId`

**Status**: REMOVED. Use `DELETE /api/assignments/:assignmentId` instead.

### `GET /api/lessons/:lessonId/tools`

**Status**: REMOVED. Use `GET /api/lessons/:lessonId/assignments` instead.

### `POST /api/lessons/:lessonId/tools`

**Status**: REMOVED. Use `POST /api/lessons/:lessonId/assignments` instead.

### `PUT /api/tools/:toolId`

**Status**: REMOVED. Use `PUT /api/assignments/:assignmentId` instead.

### `DELETE /api/tools/:toolId`

**Status**: REMOVED. Use `DELETE /api/assignments/:assignmentId` instead.

---

## Modified Endpoints (2)

### `GET /api/lessons/:lessonId/completions`

**Auth**: `authenticate()` (applied at router root)

**Path Params**:
| Param | Type | Description |
|---|---|---|
| `lessonId` | UUID string | The lesson to query completions for |

**Query Params**: None

**Request Body**: None

**Response 200**:

```json
{
	"data": {
		"completions": [
			{
				"assignmentId": "uuid-string",
				"completedAt": "2026-06-10T12:00:00.000Z"
			}
		]
	}
}
```

**Previous response shape** (removed):

```json
{
	"data": {
		"completions": [
			{ "type": "resource", "targetId": "...", "completedAt": "..." },
			{ "type": "tool", "targetId": "...", "completedAt": "..." }
		],
		"requiredItems": [
			{
				"type": "resource",
				"targetId": "...",
				"isRequired": true,
				"completed": false
			},
			{
				"type": "tool",
				"targetId": "...",
				"isRequired": true,
				"completed": true
			}
		]
	}
}
```

**Breaking changes**:

- The `type` field (`'resource' | 'tool'`) is removed from completion items.
- The `targetId` field is renamed to `assignmentId`.
- The `requiredItems` array is removed from the response. The client determines required/completed status from the assignment list and completions independently.

**Status Codes**:
| Code | Condition |
|---|---|
| 200 | Success (empty array if no completions) |
| 401 | Unauthenticated |

**Error Codes**: None specific -- standard auth errors only.

---

### `POST /api/lessons/:lessonId/completions`

**Auth**: `authenticate()` (applied at router root)

**Path Params**:
| Param | Type | Description |
|---|---|---|
| `lessonId` | UUID string | The lesson containing the assignment |

**Request Body**:

```json
{
	"assignmentId": "uuid-string"
}
```

**Zod Schema**:

```ts
z.object({
	assignmentId: z.string().uuid(),
});
```

**Previous request body** (removed):

```json
{
  "type": "resource" | "tool",
  "targetId": "uuid-string"
}
```

**Response 200** (after toggle):

```json
{
	"data": {
		"completions": [
			{
				"assignmentId": "uuid-string",
				"completedAt": "2026-06-10T12:00:00.000Z"
			}
		]
	}
}
```

The endpoint toggles the completion state: if a completion exists for the user + assignment, it is deleted; if not, it is created. The response returns the full updated completions list for the lesson.

**Status Codes**:
| Code | Condition |
|---|---|
| 200 | Success (completion toggled) |
| 400 | Invalid request body (missing or non-UUID `assignmentId`) |
| 401 | Unauthenticated |
| 404 | Assignment not found in this lesson |

**Error Codes**:
| Code | Condition |
|---|---|
| `VALIDATION_ERROR` | Invalid request body |
| `NOT_FOUND` | Assignment does not exist or does not belong to the specified lesson |

---

## New Endpoint (1)

### `POST /api/assessments/:assessmentId/import-questions`

Copies questions from a practice problem assignment into the target assessment. Creates new `AssessmentQuestion` records with content duplicated from the source `PracticeProblemQuestion` records. The source practice problem questions remain unchanged.

**Auth**: `authenticate()` + `authorize('teacher', 'admin')` + `requireCourseOwnership('assessment', ...)`

**Path Params**:
| Param | Type | Description |
|---|---|---|
| `assessmentId` | UUID string | The target assessment to import questions into |

**Request Body**:

```json
{
	"practiceProblemAssignmentId": "uuid-string"
}
```

**Zod Schema**:

```ts
z.object({
	practiceProblemAssignmentId: z.string().uuid(),
});
```

**Response 201**:

```json
{
	"data": [
		{
			"id": "uuid-string",
			"type": "multiple_choice",
			"question": "What is 2 + 2?",
			"content": {
				"question": "What is 2 + 2?",
				"options": ["3", "4", "5", "6"],
				"correctIndex": 1
			},
			"order": 3,
			"assessmentId": "uuid-string",
			"calculatorEnabled": false,
			"createdAt": "2026-06-10T12:00:00.000Z",
			"updatedAt": "2026-06-10T12:00:00.000Z"
		}
	]
}
```

The response is an array of the newly created `AssessmentQuestion` records. The `order` values are appended after the assessment's existing questions.

**Status Codes**:
| Code | Condition |
|---|---|
| 201 | Questions imported successfully |
| 400 | Invalid request body |
| 401 | Unauthenticated |
| 403 | User is not teacher/admin, or does not own the course, or practice problem is in a different course |
| 404 | Assessment not found (or soft-deleted), or practice problem assignment not found |

**Error Codes**:
| Code | Condition |
|---|---|
| `VALIDATION_ERROR` | Invalid request body (missing or non-UUID `practiceProblemAssignmentId`) |
| `NOT_FOUND` | Assessment not found or practice problem assignment not found |
| `FORBIDDEN` | Practice problem assignment belongs to a different course than the assessment |

**Notes**:

- The import is a copy operation. Source `PracticeProblemQuestion` records are not modified or deleted.
- Questions are always appended after existing assessment questions. The `order` values start at `MAX(existing order) + 1`.
- Multiple imports from the same source are allowed -- each import creates new question records (no deduplication).
- The `PracticeProblemQuestion.content` JSON is copied directly into `AssessmentQuestion.content`. The `question` field on `AssessmentQuestion` is extracted from `content.question` if present, or defaults to an empty string.
- The `calculatorEnabled` flag is extracted from `content.calculatorEnabled` if present, or defaults to `false`.
- The `type` field on each `AssessmentQuestion` matches the `PracticeProblemQuestion.type` (typically `multiple_choice` for migrated data, but could be any `QuestionType`).

---

## Unchanged Endpoints

The following endpoints are explicitly **not changed** by this migration:

| Endpoint                                       | Notes                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `GET /api/lessons/:lessonId/assignments`       | Already returns all assignment types. Now the sole source of lesson content. |
| `POST /api/lessons/:lessonId/assignments`      | Already supports all assignment types.                                       |
| `PUT /api/assignments/:assignmentId`           | Already supports all assignment types.                                       |
| `DELETE /api/assignments/:assignmentId`        | Already supports all assignment types.                                       |
| `GET /api/lessons/:lessonId/assessment`        | Quiz flow unchanged.                                                         |
| `POST /api/lessons/:lessonId/assessment`       | Quiz flow unchanged.                                                         |
| `PUT /api/assessments/:assessmentId`           | Assessment update unchanged.                                                 |
| `POST /api/assessments/:assessmentId/attempts` | Attempt submission unchanged.                                                |
| `POST /api/lessons/:lessonId/complete`         | Lesson completion logic unchanged.                                           |
| `DELETE /api/lessons/:lessonId/complete`       | Lesson completion logic unchanged.                                           |
| `GET /api/courses/:courseId/progress`          | Progress calculation unchanged.                                              |
