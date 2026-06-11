-- ============================================================
-- DATA MIGRATION: LessonResource + LessonTool → Assignment
-- All INSERTs use ON CONFLICT DO NOTHING for idempotency.
-- Must run BEFORE the DROP TABLE statements below.
-- ============================================================

-- Step 1: Migrate Note and Lecture Resources to Note Assignments
WITH resource_ordered AS (
  SELECT
    lr.id AS resource_id,
    lr."lessonId" AS lesson_id,
    lr.title,
    lr.content,
    lr."createdAt" AS created_at,
    lr."updatedAt" AS updated_at,
    ROW_NUMBER() OVER (PARTITION BY lr."lessonId" ORDER BY lr."order") AS rn
  FROM lesson_resource lr
  WHERE lr.type IN ('note', 'lecture')
    AND NOT EXISTS (
      SELECT 1 FROM assignment a WHERE a.id = lr.id
    )
),
lesson_max_order AS (
  SELECT "lessonId", COALESCE(MAX("order"), 0) AS max_order
  FROM assignment
  GROUP BY "lessonId"
),
new_assignments AS (
  INSERT INTO assignment (id, "lessonId", "order", title, objective, type, "createdAt", "updatedAt")
  SELECT
    ro.resource_id,
    ro.lesson_id,
    COALESCE(lmo.max_order, 0) + ro.rn,
    ro.title,
    NULL,
    'note',
    ro.created_at,
    ro.updated_at
  FROM resource_ordered ro
  LEFT JOIN lesson_max_order lmo ON lmo."lessonId" = ro.lesson_id
  ON CONFLICT (id) DO NOTHING
  RETURNING id
)
INSERT INTO note_assignment (id, "assignmentId", content)
SELECT gen_random_uuid(), ro.resource_id, ro.content::jsonb
FROM resource_ordered ro
WHERE NOT EXISTS (
  SELECT 1 FROM note_assignment na WHERE na."assignmentId" = ro.resource_id
)
ON CONFLICT DO NOTHING;

-- Step 2: Migrate Video Resources to Video Assignments
WITH video_ordered AS (
  SELECT
    lr.id AS resource_id,
    lr."lessonId" AS lesson_id,
    lr.title,
    lr.content,
    lr."createdAt" AS created_at,
    lr."updatedAt" AS updated_at,
    ROW_NUMBER() OVER (PARTITION BY lr."lessonId" ORDER BY lr."order") AS rn
  FROM lesson_resource lr
  WHERE lr.type = 'video'
    AND NOT EXISTS (
      SELECT 1 FROM assignment a WHERE a.id = lr.id
    )
),
lesson_max_order_v AS (
  SELECT "lessonId", COALESCE(MAX("order"), 0) AS max_order
  FROM assignment
  GROUP BY "lessonId"
)
INSERT INTO assignment (id, "lessonId", "order", title, objective, type, "createdAt", "updatedAt")
SELECT
  vo.resource_id,
  vo.lesson_id,
  COALESCE(lmo.max_order, 0) + vo.rn,
  vo.title,
  NULL,
  'video',
  vo.created_at,
  vo.updated_at
FROM video_ordered vo
LEFT JOIN lesson_max_order_v lmo ON lmo."lessonId" = vo.lesson_id
ON CONFLICT (id) DO NOTHING;

INSERT INTO video_assignment (id, "assignmentId", url, title)
SELECT
  gen_random_uuid(),
  lr.id,
  lr.content::jsonb ->> 'url',
  lr.title
FROM lesson_resource lr
WHERE lr.type = 'video'
  AND NOT EXISTS (
    SELECT 1 FROM video_assignment va WHERE va."assignmentId" = lr.id
  )
ON CONFLICT DO NOTHING;

-- Step 3: Migrate Vocab Tools (grouped per lesson into one VocabAssignment)
WITH lessons_with_vocab AS (
  SELECT DISTINCT "lessonId"
  FROM lesson_tool
  WHERE type = 'vocab'
    AND "lessonId" NOT IN (
      SELECT a."lessonId" FROM assignment a WHERE a.type = 'vocab'
    )
),
lesson_max_order_vocab AS (
  SELECT "lessonId", COALESCE(MAX("order"), 0) AS max_order
  FROM assignment
  GROUP BY "lessonId"
),
new_vocab_assignments AS (
  INSERT INTO assignment (id, "lessonId", "order", title, objective, type, "createdAt", "updatedAt")
  SELECT
    gen_random_uuid(),
    lv."lessonId",
    COALESCE(lmo.max_order, 0) + 1,
    'Vocabulary',
    NULL,
    'vocab',
    NOW(),
    NOW()
  FROM lessons_with_vocab lv
  LEFT JOIN lesson_max_order_vocab lmo ON lmo."lessonId" = lv."lessonId"
  RETURNING id, "lessonId"
),
new_vocab_child AS (
  INSERT INTO vocab_assignment (id, "assignmentId")
  SELECT gen_random_uuid(), nva.id
  FROM new_vocab_assignments nva
  RETURNING id, "assignmentId"
)
INSERT INTO vocab_assignment_entry (id, "vocabAssignmentId", term, definition, example, "order", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  nvc.id,
  lt.content::jsonb ->> 'term',
  lt.content::jsonb ->> 'definition',
  lt.content::jsonb ->> 'example',
  lt."order",
  lt."createdAt",
  lt."updatedAt"
FROM lesson_tool lt
JOIN new_vocab_assignments nva ON nva."lessonId" = lt."lessonId"
JOIN new_vocab_child nvc ON nvc."assignmentId" = nva.id
WHERE lt.type = 'vocab';

-- Step 4: Migrate Practice Problem Tools (grouped per lesson into one PracticeProblemAssignment)
WITH lessons_with_pp AS (
  SELECT DISTINCT "lessonId"
  FROM lesson_tool
  WHERE type = 'practice_problem'
    AND "lessonId" NOT IN (
      SELECT a."lessonId" FROM assignment a WHERE a.type = 'practice_problem'
    )
),
lesson_max_order_pp AS (
  SELECT "lessonId", COALESCE(MAX("order"), 0) AS max_order
  FROM assignment
  GROUP BY "lessonId"
),
new_pp_assignments AS (
  INSERT INTO assignment (id, "lessonId", "order", title, objective, type, "createdAt", "updatedAt")
  SELECT
    gen_random_uuid(),
    lp."lessonId",
    COALESCE(lmo.max_order, 0) + 1,
    'Practice Problems',
    NULL,
    'practice_problem',
    NOW(),
    NOW()
  FROM lessons_with_pp lp
  LEFT JOIN lesson_max_order_pp lmo ON lmo."lessonId" = lp."lessonId"
  RETURNING id, "lessonId"
),
new_pp_child AS (
  INSERT INTO practice_problem_assignment (id, "assignmentId", "passingPercentage")
  SELECT gen_random_uuid(), npa.id, NULL
  FROM new_pp_assignments npa
  RETURNING id, "assignmentId"
)
INSERT INTO practice_problem_question (id, "practiceProblemAssignmentId", "order", type, content)
SELECT
  gen_random_uuid(),
  npc.id,
  lt."order",
  'multiple_choice',
  lt.content::jsonb
FROM lesson_tool lt
JOIN new_pp_assignments npa ON npa."lessonId" = lt."lessonId"
JOIN new_pp_child npc ON npc."assignmentId" = npa.id
WHERE lt.type = 'practice_problem';

-- Step 5: Migrate LessonResourceCompletion → AssignmentCompletion
-- Resource IDs were reused as assignment IDs, so direct mapping.
INSERT INTO assignment_completion (id, "userId", "assignmentId", "completedAt", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  lrc."userId",
  lrc."resourceId",
  lrc."completedAt",
  lrc."completedAt",
  lrc."completedAt"
FROM lesson_resource_completion lrc
WHERE EXISTS (SELECT 1 FROM assignment a WHERE a.id = lrc."resourceId")
ON CONFLICT ("userId", "assignmentId") DO NOTHING;

-- Step 6: Migrate LessonToolCompletion → AssignmentCompletion
-- Tool completions map to the grouped assignment for that lesson + type.
INSERT INTO assignment_completion (id, "userId", "assignmentId", "completedAt", "createdAt", "updatedAt")
SELECT DISTINCT ON (ltc."userId", a.id)
  gen_random_uuid(),
  ltc."userId",
  a.id,
  ltc."completedAt",
  ltc."completedAt",
  ltc."completedAt"
FROM lesson_tool_completion ltc
JOIN lesson_tool lt ON lt.id = ltc."toolId"
JOIN assignment a ON a."lessonId" = lt."lessonId"
  AND a.type = CASE lt.type
    WHEN 'practice_problem' THEN 'practice_problem'::"AssignmentType"
    WHEN 'vocab' THEN 'vocab'::"AssignmentType"
  END
ON CONFLICT ("userId", "assignmentId") DO NOTHING;

-- ============================================================
-- DDL: Drop source tables and enums (AFTER data migration)
-- ============================================================

-- DropForeignKey
ALTER TABLE "lesson_resource" DROP CONSTRAINT "lesson_resource_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_resource_completion" DROP CONSTRAINT "lesson_resource_completion_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_resource_completion" DROP CONSTRAINT "lesson_resource_completion_userId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_tool" DROP CONSTRAINT "lesson_tool_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_tool_completion" DROP CONSTRAINT "lesson_tool_completion_toolId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_tool_completion" DROP CONSTRAINT "lesson_tool_completion_userId_fkey";

-- DropForeignKey
ALTER TABLE "student_lesson_tool_flash_card" DROP CONSTRAINT "student_lesson_tool_flash_card_toolId_fkey";

-- DropForeignKey
ALTER TABLE "student_lesson_tool_flash_card" DROP CONSTRAINT "student_lesson_tool_flash_card_userId_fkey";

-- DropTable
DROP TABLE "lesson_resource";

-- DropTable
DROP TABLE "lesson_resource_completion";

-- DropTable
DROP TABLE "lesson_tool";

-- DropTable
DROP TABLE "lesson_tool_completion";

-- DropTable
DROP TABLE "student_lesson_tool_flash_card";

-- DropEnum
DROP TYPE "ResourceType";

-- DropEnum
DROP TYPE "ToolType";
