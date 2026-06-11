import type { JsonObject } from 'swagger-ui-express';

export const swaggerDocument: JsonObject = {
  openapi: '3.0.3',
  info: {
    title: 'Course Masters API',
    version: '0.1.0',
    description: 'REST API for the Course Masters self-directed learning platform.',
  },
  servers: [{ url: '/api', description: 'API base path' }],
  tags: [
    { name: 'Health', description: 'Health check' },
    { name: 'Courses', description: 'Course CRUD' },
    { name: 'Units', description: 'Unit CRUD (scoped to a course)' },
    { name: 'Lessons', description: 'Lesson CRUD (scoped to a unit)' },
    { name: 'Student Notes', description: 'Per-student notes on a lesson' },
    { name: 'Assessments', description: 'Quizzes and exams with graded attempts' },
    { name: 'Completions', description: 'Lesson and unit completion tracking' },
    { name: 'Assignment Completions', description: 'Per-assignment completion tracking' },
    { name: 'Progress', description: 'Course and unit progress' },
    { name: 'YouTube', description: 'YouTube utilities' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'better-auth.session_token',
        description: 'Session cookie set by better-auth after login via POST /api/auth/sign-in/email',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'NOT_FOUND' },
              message: { type: 'string', example: 'Resource not found' },
              details: { type: 'object' },
            },
          },
        },
      },
      Course: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          syllabus: { type: 'object', nullable: true },
          authorId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateCourse: {
        type: 'object',
        required: ['title', 'description'],
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 1 },
          syllabus: { type: 'object' },
        },
      },
      UpdateCourse: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 1 },
          syllabus: { type: 'object' },
        },
      },
      Unit: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          order: { type: 'integer' },
          courseId: { type: 'string', format: 'uuid' },
        },
      },
      CreateUnit: {
        type: 'object',
        required: ['title', 'description', 'order'],
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 1 },
          order: { type: 'integer', minimum: 0 },
        },
      },
      UpdateUnit: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 1 },
          order: { type: 'integer', minimum: 0 },
        },
      },
      Lesson: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          order: { type: 'integer' },
          unitId: { type: 'string', format: 'uuid' },
          objective: { type: 'string' },
          planContent: { type: 'object' },
        },
      },
      CreateLesson: {
        type: 'object',
        required: ['title', 'description', 'order', 'objective', 'planContent'],
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 1 },
          order: { type: 'integer', minimum: 0 },
          objective: { type: 'string', minLength: 1 },
          planContent: { type: 'object' },
        },
      },
      UpdateLesson: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 1 },
          order: { type: 'integer', minimum: 0 },
          objective: { type: 'string', minLength: 1 },
          planContent: { type: 'object' },
        },
      },
      StudentNote: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          content: { type: 'string' },
          lessonId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      UpsertStudentNote: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', minLength: 1 },
        },
      },
      AssessmentQuestion: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['multiple_choice', 'true_false', 'matching', 'fill_in_blank'] },
          question: { type: 'string' },
          content: { type: 'object', description: 'Type-specific answer data (e.g. {options, correctIndex} for multiple_choice)' },
          order: { type: 'integer' },
          assessmentId: { type: 'string', format: 'uuid' },
        },
      },
      Assessment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['lesson_quiz', 'unit_quiz', 'course_exam'] },
          lessonId: { type: 'string', format: 'uuid', nullable: true },
          unitId: { type: 'string', format: 'uuid', nullable: true },
          courseId: { type: 'string', format: 'uuid', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          questions: { type: 'array', items: { $ref: '#/components/schemas/AssessmentQuestion' } },
        },
      },
      CreateAssessment: {
        type: 'object',
        required: ['questions'],
        properties: {
          questions: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['question', 'content', 'order'],
              properties: {
                type: { type: 'string', enum: ['multiple_choice', 'true_false', 'matching', 'fill_in_blank'], default: 'multiple_choice' },
                question: { type: 'string', minLength: 1 },
                content: { type: 'object' },
                order: { type: 'integer', minimum: 0 },
              },
            },
          },
        },
      },
      AssessmentAttempt: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          score: { type: 'number' },
          passed: { type: 'boolean' },
          userId: { type: 'string', format: 'uuid' },
          assessmentId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      SubmitAttempt: {
        type: 'object',
        required: ['answers'],
        properties: {
          answers: { type: 'array', items: {} },
        },
      },
      ToggleCompletion: {
        type: 'object',
        required: ['assignmentId'],
        properties: {
          assignmentId: { type: 'string', format: 'uuid' },
        },
      },
      AssignmentCompletion: {
        type: 'object',
        properties: {
          assignmentId: { type: 'string', format: 'uuid' },
          completedAt: { type: 'string', format: 'date-time' },
        },
      },
      ImportQuestions: {
        type: 'object',
        required: ['practiceProblemAssignmentId'],
        properties: {
          practiceProblemAssignmentId: { type: 'string', format: 'uuid' },
        },
      },
      CourseProgress: {
        type: 'object',
        properties: {
          courseId: { type: 'string', format: 'uuid' },
          percent: { type: 'integer' },
          completedLessons: { type: 'integer' },
          totalLessons: { type: 'integer' },
          examPassed: { type: 'boolean' },
        },
      },
      UnitProgress: {
        type: 'object',
        properties: {
          unitId: { type: 'string', format: 'uuid' },
          lessons: { type: 'array', items: { type: 'object' } },
          quizPassed: { type: 'boolean' },
          complete: { type: 'boolean' },
        },
      },
    },
    parameters: {
      courseId: { name: 'courseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      unitId: { name: 'unitId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      lessonId: { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      assessmentId: { name: 'assessmentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      studentNoteId: { name: 'studentNoteId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
    },
    responses: {
      Unauthorized: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      Forbidden: { description: 'Insufficient permissions', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      NotFound: { description: 'Resource not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      ValidationError: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    },
  },
  security: [{ cookieAuth: [] }],
  paths: {
    // ── Health ──────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        security: [],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } } } } } },
      },
    },

    // ── Courses ────────────────────────────────────────────
    '/courses': {
      get: {
        tags: ['Courses'],
        summary: 'List all courses',
        responses: {
          200: { description: 'Array of courses', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Course' } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Courses'],
        summary: 'Create a course',
        description: 'Requires teacher or admin role.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCourse' } } } },
        responses: {
          201: { description: 'Created course', content: { 'application/json': { schema: { $ref: '#/components/schemas/Course' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/courses/{courseId}': {
      get: {
        tags: ['Courses'],
        summary: 'Get a course by ID',
        parameters: [{ $ref: '#/components/parameters/courseId' }],
        responses: {
          200: { description: 'Course', content: { 'application/json': { schema: { $ref: '#/components/schemas/Course' } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Courses'],
        summary: 'Update a course',
        parameters: [{ $ref: '#/components/parameters/courseId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateCourse' } } } },
        responses: {
          200: { description: 'Updated course', content: { 'application/json': { schema: { $ref: '#/components/schemas/Course' } } } },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
      delete: {
        tags: ['Courses'],
        summary: 'Delete a course',
        parameters: [{ $ref: '#/components/parameters/courseId' }],
        responses: {
          204: { description: 'Deleted' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Units ──────────────────────────────────────────────
    '/courses/{courseId}/units': {
      get: {
        tags: ['Units'],
        summary: 'List units for a course',
        parameters: [{ $ref: '#/components/parameters/courseId' }],
        responses: {
          200: { description: 'Array of units', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Unit' } } } } },
        },
      },
      post: {
        tags: ['Units'],
        summary: 'Create a unit',
        parameters: [{ $ref: '#/components/parameters/courseId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUnit' } } } },
        responses: {
          201: { description: 'Created unit', content: { 'application/json': { schema: { $ref: '#/components/schemas/Unit' } } } },
          403: { $ref: '#/components/responses/Forbidden' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/courses/{courseId}/units/{unitId}': {
      get: {
        tags: ['Units'],
        summary: 'Get a unit by ID',
        parameters: [{ $ref: '#/components/parameters/courseId' }, { $ref: '#/components/parameters/unitId' }],
        responses: {
          200: { description: 'Unit', content: { 'application/json': { schema: { $ref: '#/components/schemas/Unit' } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Units'],
        summary: 'Update a unit',
        parameters: [{ $ref: '#/components/parameters/courseId' }, { $ref: '#/components/parameters/unitId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUnit' } } } },
        responses: {
          200: { description: 'Updated unit', content: { 'application/json': { schema: { $ref: '#/components/schemas/Unit' } } } },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
      delete: {
        tags: ['Units'],
        summary: 'Delete a unit',
        parameters: [{ $ref: '#/components/parameters/courseId' }, { $ref: '#/components/parameters/unitId' }],
        responses: {
          204: { description: 'Deleted' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Lessons ────────────────────────────────────────────
    '/units/{unitId}/lessons': {
      get: {
        tags: ['Lessons'],
        summary: 'List lessons for a unit',
        parameters: [{ $ref: '#/components/parameters/unitId' }],
        responses: {
          200: { description: 'Array of lessons', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Lesson' } } } } },
        },
      },
      post: {
        tags: ['Lessons'],
        summary: 'Create a lesson',
        parameters: [{ $ref: '#/components/parameters/unitId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateLesson' } } } },
        responses: {
          201: { description: 'Created lesson', content: { 'application/json': { schema: { $ref: '#/components/schemas/Lesson' } } } },
          403: { $ref: '#/components/responses/Forbidden' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/units/{unitId}/lessons/{lessonId}': {
      get: {
        tags: ['Lessons'],
        summary: 'Get a lesson by ID',
        parameters: [{ $ref: '#/components/parameters/unitId' }, { $ref: '#/components/parameters/lessonId' }],
        responses: {
          200: { description: 'Lesson', content: { 'application/json': { schema: { $ref: '#/components/schemas/Lesson' } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Lessons'],
        summary: 'Update a lesson',
        parameters: [{ $ref: '#/components/parameters/unitId' }, { $ref: '#/components/parameters/lessonId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateLesson' } } } },
        responses: {
          200: { description: 'Updated lesson', content: { 'application/json': { schema: { $ref: '#/components/schemas/Lesson' } } } },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
      delete: {
        tags: ['Lessons'],
        summary: 'Delete a lesson',
        parameters: [{ $ref: '#/components/parameters/unitId' }, { $ref: '#/components/parameters/lessonId' }],
        responses: {
          204: { description: 'Deleted' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Student Notes ──────────────────────────────────────
    '/lessons/{lessonId}/student-notes': {
      get: {
        tags: ['Student Notes'],
        summary: 'Get the current user\'s note for a lesson',
        parameters: [{ $ref: '#/components/parameters/lessonId' }],
        responses: {
          200: { description: 'Student note (or null)', content: { 'application/json': { schema: { $ref: '#/components/schemas/StudentNote' } } } },
        },
      },
      post: {
        tags: ['Student Notes'],
        summary: 'Create or update a student note',
        parameters: [{ $ref: '#/components/parameters/lessonId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpsertStudentNote' } } } },
        responses: {
          200: { description: 'Upserted note', content: { 'application/json': { schema: { $ref: '#/components/schemas/StudentNote' } } } },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/student-notes/{studentNoteId}': {
      delete: {
        tags: ['Student Notes'],
        summary: 'Delete a student note',
        parameters: [{ $ref: '#/components/parameters/studentNoteId' }],
        responses: {
          204: { description: 'Deleted' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Assessments ────────────────────────────────────────
    '/lessons/{lessonId}/assessment': {
      get: {
        tags: ['Assessments'],
        summary: 'Get the lesson quiz',
        parameters: [{ $ref: '#/components/parameters/lessonId' }],
        responses: {
          200: { description: 'Assessment with questions', content: { 'application/json': { schema: { $ref: '#/components/schemas/Assessment' } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        tags: ['Assessments'],
        summary: 'Create a lesson quiz',
        description: 'Requires teacher or admin role.',
        parameters: [{ $ref: '#/components/parameters/lessonId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAssessment' } } } },
        responses: {
          201: { description: 'Created assessment', content: { 'application/json': { schema: { $ref: '#/components/schemas/Assessment' } } } },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { description: 'Assessment already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/units/{unitId}/assessment': {
      get: {
        tags: ['Assessments'],
        summary: 'Get the unit quiz',
        parameters: [{ $ref: '#/components/parameters/unitId' }],
        responses: {
          200: { description: 'Assessment with questions', content: { 'application/json': { schema: { $ref: '#/components/schemas/Assessment' } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        tags: ['Assessments'],
        summary: 'Create a unit quiz',
        description: 'Requires teacher or admin role.',
        parameters: [{ $ref: '#/components/parameters/unitId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAssessment' } } } },
        responses: {
          201: { description: 'Created assessment', content: { 'application/json': { schema: { $ref: '#/components/schemas/Assessment' } } } },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { description: 'Assessment already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/courses/{courseId}/assessment': {
      get: {
        tags: ['Assessments'],
        summary: 'Get the course exam',
        parameters: [{ $ref: '#/components/parameters/courseId' }],
        responses: {
          200: { description: 'Assessment with questions', content: { 'application/json': { schema: { $ref: '#/components/schemas/Assessment' } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        tags: ['Assessments'],
        summary: 'Create a course exam',
        description: 'Requires teacher or admin role.',
        parameters: [{ $ref: '#/components/parameters/courseId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAssessment' } } } },
        responses: {
          201: { description: 'Created assessment', content: { 'application/json': { schema: { $ref: '#/components/schemas/Assessment' } } } },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { description: 'Assessment already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/assessments/{assessmentId}': {
      put: {
        tags: ['Assessments'],
        summary: 'Update an assessment',
        description: 'Replaces all questions. Requires teacher or admin role.',
        parameters: [{ $ref: '#/components/parameters/assessmentId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAssessment' } } } },
        responses: {
          200: { description: 'Updated assessment', content: { 'application/json': { schema: { $ref: '#/components/schemas/Assessment' } } } },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/assessments/{assessmentId}/attempts': {
      get: {
        tags: ['Assessments'],
        summary: 'List attempts for an assessment',
        parameters: [{ $ref: '#/components/parameters/assessmentId' }],
        responses: {
          200: { description: 'Array of attempts', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AssessmentAttempt' } } } } },
        },
      },
      post: {
        tags: ['Assessments'],
        summary: 'Submit an assessment attempt',
        description: 'Server grades the answers and returns the score. Pass threshold is 80%.',
        parameters: [{ $ref: '#/components/parameters/assessmentId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmitAttempt' } } } },
        responses: {
          201: { description: 'Graded attempt', content: { 'application/json': { schema: { $ref: '#/components/schemas/AssessmentAttempt' } } } },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },

    // ── Assignment Completions ─────────────────────────────
    '/lessons/{lessonId}/completions': {
      get: {
        tags: ['Assignment Completions'],
        summary: 'Get assignment completions for a lesson',
        parameters: [{ $ref: '#/components/parameters/lessonId' }],
        responses: {
          200: {
            description: 'Completions object',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    completions: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AssignmentCompletion' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Assignment Completions'],
        summary: 'Toggle an assignment completion',
        parameters: [{ $ref: '#/components/parameters/lessonId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ToggleCompletion' } } } },
        responses: {
          200: {
            description: 'Completion toggled — returns updated completions list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    completions: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AssignmentCompletion' },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Import Questions ───────────────────────────────────
    '/assessments/{assessmentId}/import-questions': {
      post: {
        tags: ['Assessments'],
        summary: 'Import questions from a practice problem assignment',
        description: 'Copies questions from a PracticeProblemAssignment into the target assessment. Source questions are not modified. Requires teacher or admin role and course ownership.',
        parameters: [{ $ref: '#/components/parameters/assessmentId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ImportQuestions' } } } },
        responses: {
          201: {
            description: 'Imported questions',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/AssessmentQuestion' },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Lesson / Unit Completions ──────────────────────────
    '/lessons/{lessonId}/complete': {
      post: {
        tags: ['Completions'],
        summary: 'Mark a lesson as complete',
        parameters: [{ $ref: '#/components/parameters/lessonId' }],
        responses: { 200: { description: 'Completion recorded' } },
      },
      delete: {
        tags: ['Completions'],
        summary: 'Remove lesson completion',
        parameters: [{ $ref: '#/components/parameters/lessonId' }],
        responses: { 200: { description: 'Completion removed' } },
      },
    },
    '/units/{unitId}/complete': {
      post: {
        tags: ['Completions'],
        summary: 'Mark a unit as complete',
        parameters: [{ $ref: '#/components/parameters/unitId' }],
        responses: { 200: { description: 'Completion recorded' } },
      },
      delete: {
        tags: ['Completions'],
        summary: 'Remove unit completion',
        parameters: [{ $ref: '#/components/parameters/unitId' }],
        responses: { 200: { description: 'Completion removed' } },
      },
    },

    // ── Progress ───────────────────────────────────────────
    '/courses/{courseId}/progress': {
      get: {
        tags: ['Progress'],
        summary: 'Get course progress for the current user',
        parameters: [{ $ref: '#/components/parameters/courseId' }],
        responses: {
          200: { description: 'Course progress', content: { 'application/json': { schema: { $ref: '#/components/schemas/CourseProgress' } } } },
        },
      },
    },
    '/courses/{courseId}/units/{unitId}/progress': {
      get: {
        tags: ['Progress'],
        summary: 'Get unit progress for the current user',
        parameters: [{ $ref: '#/components/parameters/courseId' }, { $ref: '#/components/parameters/unitId' }],
        responses: {
          200: { description: 'Unit progress', content: { 'application/json': { schema: { $ref: '#/components/schemas/UnitProgress' } } } },
        },
      },
    },

    // ── YouTube ────────────────────────────────────────────
    '/youtube/title': {
      get: {
        tags: ['YouTube'],
        summary: 'Fetch a YouTube video title',
        parameters: [{ name: 'url', in: 'query', required: true, schema: { type: 'string' }, description: 'YouTube video URL' }],
        responses: {
          200: { description: 'Video title', content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' } } } } } },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
  },
};
