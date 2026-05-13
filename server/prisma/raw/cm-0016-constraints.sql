-- cm-0016: Data integrity constraints
-- Applied idempotently via seed.ts or manually:
--   psql $DATABASE_URL -f server/prisma/raw/cm-0016-constraints.sql

-- ── Pre-constraint cleanup ────────────────────────────────────────────────────
-- Remove any assessment rows that violate the single-owner rule before
-- applying the CHECK constraint.
DELETE FROM assessment
WHERE (
  ("lessonId" IS NOT NULL)::int +
  ("unitId"   IS NOT NULL)::int +
  ("courseId" IS NOT NULL)::int
) <> 1;

-- ── CHECK constraint on assessment ───────────────────────────────────────────
-- Enforces that exactly one of lessonId, unitId, courseId is non-null.
ALTER TABLE assessment
  DROP CONSTRAINT IF EXISTS chk_assessment_single_owner;

ALTER TABLE assessment
  ADD CONSTRAINT chk_assessment_single_owner
    CHECK (
      (("lessonId" IS NOT NULL)::int +
       ("unitId"   IS NOT NULL)::int +
       ("courseId" IS NOT NULL)::int) = 1
    );

-- ── Trigger function for assignment sub-table enforcement ─────────────────────
-- Verifies that the sub-table row for the declared type exists at commit time.
CREATE OR REPLACE FUNCTION enforce_assignment_subtype()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.type = 'note' THEN
    IF NOT EXISTS (SELECT 1 FROM note_assignment WHERE "assignmentId" = NEW.id) THEN
      RAISE EXCEPTION 'assignment % declared type=note but no note_assignment row exists', NEW.id;
    END IF;
  ELSIF NEW.type = 'video' THEN
    IF NOT EXISTS (SELECT 1 FROM video_assignment WHERE "assignmentId" = NEW.id) THEN
      RAISE EXCEPTION 'assignment % declared type=video but no video_assignment row exists', NEW.id;
    END IF;
  ELSIF NEW.type = 'reading' THEN
    IF NOT EXISTS (SELECT 1 FROM reading_assignment WHERE "assignmentId" = NEW.id) THEN
      RAISE EXCEPTION 'assignment % declared type=reading but no reading_assignment row exists', NEW.id;
    END IF;
  ELSIF NEW.type = 'vocab' THEN
    IF NOT EXISTS (SELECT 1 FROM vocab_assignment WHERE "assignmentId" = NEW.id) THEN
      RAISE EXCEPTION 'assignment % declared type=vocab but no vocab_assignment row exists', NEW.id;
    END IF;
  ELSIF NEW.type = 'practice_problem' THEN
    IF NOT EXISTS (SELECT 1 FROM practice_problem_assignment WHERE "assignmentId" = NEW.id) THEN
      RAISE EXCEPTION 'assignment % declared type=practice_problem but no practice_problem_assignment row exists', NEW.id;
    END IF;
  ELSE
    RAISE EXCEPTION 'assignment % has unknown type: %', NEW.id, NEW.type;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger (idempotent)
DROP TRIGGER IF EXISTS trg_assignment_subtype ON assignment;

CREATE CONSTRAINT TRIGGER trg_assignment_subtype
  AFTER INSERT OR UPDATE ON assignment
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION enforce_assignment_subtype();
